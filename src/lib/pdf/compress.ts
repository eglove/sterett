// Lossless PDF compression using qpdf compiled to WebAssembly.
//
// qpdf rewrites the PDF's internal structure: object streams, recompressed
// flate streams, and a linearized layout. Nothing is rasterized, so text stays
// selectable and images keep their original encoding.
//
// Cloudflare Workers refuse dynamic WebAssembly compilation ("Wasm code
// generation disallowed by embedder"), so the module is imported statically and
// handed to qpdf's loader in place of the compile it would otherwise do.
import createQpdf from "./qpdf-bundle.mjs";
import qpdfWasmModule from "./qpdf.wasm";

const QPDF_ARGS = [
  "--linearize",
  "--object-streams=generate",
  "--compress-streams=y",
  "--recompress-flate",
  "--compression-level=9",
  "--decode-level=none",
];

// A placeholder the loader can fetch without touching the network. The shim
// below ignores these bytes and instantiates the precompiled module instead.
// A data: URL keeps the loader off its XMLHttpRequest branch, which Workers
// do not provide.
const WASM_PLACEHOLDER = "data:application/octet-stream;base64,AGFzbQEAAAA=";

let shimInstalled = false;

// qpdf's loader reads self.location to resolve its script directory. Workers
// expose self but not location, so give it a harmless one before loading.
function installLocationGuard() {
  const scope = globalThis as any;
  if (scope.self && !scope.self.location) {
    try {
      scope.self.location = { href: "https://worker.local/" };
    } catch {
      // self.location is read-only in some runtimes; the loader tolerates it.
    }
  }
}

// Route qpdf's wasm load through the precompiled module. Without this the
// loader calls WebAssembly.instantiate on bytes, which Workers reject.
function installWasmShim() {
  if (shimInstalled) return;
  shimInstalled = true;
  installLocationGuard();
  const original = WebAssembly.instantiate.bind(WebAssembly);
  (WebAssembly as any).instantiate = async (source: any, imports: any) => {
    if (source instanceof WebAssembly.Module) return original(source, imports);
    const instance = await original(qpdfWasmModule as any, imports);
    return { module: qpdfWasmModule, instance };
  };
  (WebAssembly as any).instantiateStreaming = async (_source: any, imports: any) => {
    const instance = await original(qpdfWasmModule as any, imports);
    return { module: qpdfWasmModule, instance };
  };
}

let modulePromise: Promise<any> | undefined;

function loadQpdf(): Promise<any> {
  if (!modulePromise) {
    installWasmShim();
    modulePromise = createQpdf({ locateFile: () => WASM_PLACEHOLDER });
  }
  return modulePromise as Promise<any>;
}

export interface CompressionResult {
  bytes: Uint8Array;
  originalSize: number;
  compressedSize: number;
}

export function isPdf(mimeType: string | null | undefined, filename?: string): boolean {
  if (mimeType && mimeType.toLowerCase() === "application/pdf") return true;
  return Boolean(filename && filename.toLowerCase().endsWith(".pdf"));
}

export async function compressPdf(input: Uint8Array): Promise<CompressionResult> {
  const qpdf = await loadQpdf();
  const inName = "/input.pdf";
  const outName = "/output.pdf";
  try {
    qpdf.FS.writeFile(inName, input);
    qpdf.callMain([inName, ...QPDF_ARGS, "--", outName]);
    const bytes: Uint8Array = qpdf.FS.readFile(outName);
    return { bytes, originalSize: input.byteLength, compressedSize: bytes.byteLength };
  } finally {
    try { qpdf.FS.unlink(inName); } catch {}
    try { qpdf.FS.unlink(outName); } catch {}
  }
}
