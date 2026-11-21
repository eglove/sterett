// A .wasm import resolves to a compiled WebAssembly.Module in Workers.
// Astro's Cloudflare adapter emits the file as an asset and imports it as a
// module, so the binding is the module itself, not a URL.
declare module "*.wasm" {
  const module: WebAssembly.Module;
  export default module;
}
