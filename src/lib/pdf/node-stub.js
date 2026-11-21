// Stub for Node built-ins that qpdf-wasm's Node branch requires.
// The Worker build takes the browser branch, so these are never called.
export default {};
export const readFileSync = () => { throw new Error('not available in Workers'); };
export const promises = {};