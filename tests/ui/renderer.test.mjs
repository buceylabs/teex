import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWindowTitleState,
  shouldUseEnhancedEditor,
  shouldUsePlainTextareaEditor,
} from "../../src/ui/renderer.js";

test("shouldUsePlainTextareaEditor keeps untitled markdown edit tabs on the fast textarea path", () => {
  assert.equal(
    shouldUsePlainTextareaEditor({
      activeKind: "markdown",
      markdownViewMode: "edit",
      activePath: null,
      openFiles: [{ path: null }],
      activeTabIndex: 0,
    }),
    true,
  );
});

test("shouldUsePlainTextareaEditor still uses CodeMirror for saved markdown files", () => {
  assert.equal(
    shouldUsePlainTextareaEditor({
      activeKind: "markdown",
      markdownViewMode: "edit",
      activePath: "/notes/today.md",
      openFiles: [{ path: "/notes/today.md" }],
      activeTabIndex: 0,
    }),
    false,
  );
});

test("shouldUseEnhancedEditor enhances code and saved markdown but not untitled markdown", () => {
  assert.equal(
    shouldUseEnhancedEditor({
      activeKind: "code",
      content: "const ready = true;",
      markdownViewMode: "edit",
      activePath: "/src/main.js",
      openFiles: [],
      activeTabIndex: 0,
    }),
    true,
  );
  assert.equal(
    shouldUseEnhancedEditor({
      activeKind: "markdown",
      content: "# Today",
      markdownViewMode: "edit",
      activePath: "/notes/today.md",
      openFiles: [{ path: "/notes/today.md" }],
      activeTabIndex: 0,
    }),
    true,
  );
  assert.equal(
    shouldUseEnhancedEditor({
      activeKind: "markdown",
      content: "",
      markdownViewMode: "edit",
      activePath: null,
      openFiles: [{ path: null }],
      activeTabIndex: 0,
    }),
    false,
  );
  assert.equal(
    shouldUseEnhancedEditor({
      activeKind: "code",
      content: "x".repeat(512 * 1024 + 1),
      markdownViewMode: "edit",
      activePath: "/tmp/large.js",
      openFiles: [],
      activeTabIndex: 0,
    }),
    false,
  );
});

test("buildWindowTitleState postfixes dirty saved file titles", () => {
  assert.deepEqual(
    buildWindowTitleState({
      mode: "file",
      rootPath: null,
      activePath: "/notes/today.md",
      isDirty: true,
      openFiles: [],
      activeTabIndex: 0,
    }),
    {
      nextTitle: "today.md  ●",
      nextRepresentedPath: "/notes/today.md",
    },
  );
});

test("buildWindowTitleState postfixes dirty untitled tab titles", () => {
  assert.deepEqual(
    buildWindowTitleState({
      mode: "files",
      rootPath: null,
      activePath: null,
      isDirty: true,
      openFiles: [{ path: null }],
      activeTabIndex: 0,
    }),
    {
      nextTitle: "Untitled  ●",
      nextRepresentedPath: null,
    },
  );
});

test("buildWindowTitleState keeps clean titles unchanged", () => {
  assert.deepEqual(
    buildWindowTitleState({
      mode: "file",
      rootPath: null,
      activePath: "/notes/today.md",
      isDirty: false,
      openFiles: [],
      activeTabIndex: 0,
    }),
    {
      nextTitle: "today.md",
      nextRepresentedPath: "/notes/today.md",
    },
  );
});
