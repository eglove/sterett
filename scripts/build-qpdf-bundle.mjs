// Regenerates src/lib/pdf/qpdf-bundle.mjs from the installed qpdf-wasm package.
//
// qpdf-wasm picks its Node branch when process.versions.node exists. Cloudflare
// Workers run with nodejs_compat, so that branch would be taken and would try to
// read the wasm from disk. Defining process as undefined forces the browser
// branch, which uses the precompiled wasm module we hand it.
import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outfile = resolve(root, "src/lib/pdf/qpdf-bundle.mjs");
mkdirSync(dirname(outfile), { recursive: true });

await build({
  entryPoints: [resolve(root, "node_modules/@neslinesli93/qpdf-wasm/dist/qpdf.js")],
  outfile,
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  define: { process: "undefined" },
  alias: {
    fs: resolve(root, "src/lib/pdf/node-stub.js"),
    path: resolve(root, "src/lib/pdf/node-stub.js"),
  },
  logLevel: "info",
});
console.log("wrote", outfile);
