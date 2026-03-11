import assert from "node:assert/strict";
import test from "node:test";

import { resolveImagePath, toLocalImageUrl } from "../../src/ui/image-paths.js";

test("resolveImagePath returns null for http URLs", () => {
  assert.equal(resolveImagePath("http://example.com/img.png", "/tmp"), null);
  assert.equal(resolveImagePath("https://example.com/img.png", "/tmp"), null);
});

test("resolveImagePath returns absolute paths unchanged", () => {
  assert.equal(
    resolveImagePath("/images/photo.png", "/tmp"),
    "/images/photo.png",
  );
});

test("resolveImagePath resolves relative paths against fileDir", () => {
  assert.equal(
    resolveImagePath("img/photo.png", "/Users/kel/docs"),
    "/Users/kel/docs/img/photo.png",
  );
});

test("resolveImagePath normalizes parent directory segments", () => {
  assert.equal(
    resolveImagePath("../assets/logo.png", "/Users/kel/docs"),
    "/Users/kel/assets/logo.png",
  );
});

test("resolveImagePath normalizes dot segments", () => {
  assert.equal(
    resolveImagePath("./photo.png", "/Users/kel/docs"),
    "/Users/kel/docs/photo.png",
  );
});

test("resolveImagePath strips query string from relative paths", () => {
  assert.equal(
    resolveImagePath(
      "./docs/F450_Architecture.png?raw=true",
      "/Users/kel/project",
    ),
    "/Users/kel/project/docs/F450_Architecture.png",
  );
});

test("resolveImagePath strips fragment from paths", () => {
  assert.equal(
    resolveImagePath("./img/photo.png#section", "/Users/kel/docs"),
    "/Users/kel/docs/img/photo.png",
  );
});

test("resolveImagePath strips query and fragment from absolute paths", () => {
  assert.equal(
    resolveImagePath("/images/photo.png?v=2#x", "/tmp"),
    "/images/photo.png",
  );
});

test("toLocalImageUrl produces localimage protocol URL", () => {
  assert.equal(
    toLocalImageUrl("/Users/kel/docs/img.png"),
    "localimage://localhost/Users/kel/docs/img.png",
  );
});
