import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const srcRoot = path.join(repoRoot, "src");
const staticImportPattern = /^import(?:[\s\S]*?from\s+)?["']([^"']+)["'];?/gm;

async function collectStaticImportGraph(entryPath) {
  const visited = new Set();

  async function visit(filePath) {
    const resolved = path.resolve(filePath);
    if (visited.has(resolved)) {
      return;
    }
    visited.add(resolved);

    const source = await readFile(resolved, "utf8");
    for (const match of source.matchAll(staticImportPattern)) {
      const specifier = match[1];
      let importedPath;
      if (specifier.startsWith(".")) {
        importedPath = path.resolve(path.dirname(resolved), specifier);
      } else if (specifier.startsWith("/")) {
        importedPath = path.resolve(srcRoot, specifier.slice(1));
      } else {
        continue;
      }
      if (!path.extname(importedPath)) {
        importedPath += ".js";
      }
      await visit(importedPath);
    }
  }

  await visit(entryPath);
  return visited;
}

test("startup entry keeps the eager module graph intentionally tiny", async () => {
  const graph = await collectStaticImportGraph(path.join(srcRoot, "main.js"));
  const relativePaths = [...graph].map((filePath) =>
    path.relative(srcRoot, filePath),
  );
  const sizes = await Promise.all([...graph].map((filePath) => stat(filePath)));
  const totalBytes = sizes.reduce((sum, entry) => sum + entry.size, 0);

  assert.ok(
    totalBytes <= 8_192,
    `startup graph is ${totalBytes} bytes across ${graph.size} modules`,
  );
  assert.equal(relativePaths.includes("app/application.js"), false);
  assert.equal(relativePaths.includes("vendor/codemirror.js"), false);
  assert.equal(relativePaths.includes("ui/markdown-renderer.js"), false);
});
