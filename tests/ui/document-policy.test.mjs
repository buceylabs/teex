import assert from "node:assert/strict";
import test from "node:test";

import {
  canAutomaticallyEnhance,
  initialMarkdownViewMode,
  MAX_AUTOMATIC_ENHANCEMENT_CHARS,
} from "../../src/ui/document-policy.js";

test("canAutomaticallyEnhance caps automatic work for large documents", () => {
  assert.equal(canAutomaticallyEnhance("a".repeat(100)), true);
  assert.equal(
    canAutomaticallyEnhance("a".repeat(MAX_AUTOMATIC_ENHANCEMENT_CHARS)),
    true,
  );
  assert.equal(
    canAutomaticallyEnhance("a".repeat(MAX_AUTOMATIC_ENHANCEMENT_CHARS + 1)),
    false,
  );
});

test("initialMarkdownViewMode keeps large markdown source-first", () => {
  assert.equal(initialMarkdownViewMode("# Small", "preview"), "preview");
  assert.equal(
    initialMarkdownViewMode(
      "a".repeat(MAX_AUTOMATIC_ENHANCEMENT_CHARS + 1),
      "preview",
    ),
    "edit",
  );
  assert.equal(initialMarkdownViewMode("# Small", "edit"), "edit");
});
