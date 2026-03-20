#!/usr/bin/env node
// Build the CodeMirror vendor bundle for teex.
// Usage: cd tools/build-codemirror && npm install && node build.mjs

import { build } from "esbuild";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [resolve(__dirname, "entry.js")],
  bundle: true,
  format: "esm",
  minify: true,
  outfile: resolve(__dirname, "../../src/vendor/codemirror.js"),
  target: "es2020",
});

console.log("Built src/vendor/codemirror.js");
