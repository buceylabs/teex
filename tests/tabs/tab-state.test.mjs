import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTabFromPayload,
  buildUntitledTab,
  snapshotActiveStateAsTab,
  switchToMultiTabFileState,
  switchToSingleFileState,
} from "../../src/tabs/tab-state.js";

test("buildTabFromPayload initializes clean tab state and markdown mode", () => {
  assert.deepEqual(
    buildTabFromPayload({
      path: "/a.md",
      content: "# a",
      kind: "markdown",
      writable: true,
    }),
    {
      path: "/a.md",
      content: "# a",
      savedContent: "# a",
      kind: "markdown",
      writable: true,
      isDirty: false,
      markdownViewMode: "preview",
      scrollState: {
        editorScrollTop: 0,
        previewScrollTop: 0,
      },
    },
  );

  assert.deepEqual(
    buildTabFromPayload({
      path: "/a.txt",
      content: "a",
      kind: "text",
      writable: false,
    }),
    {
      path: "/a.txt",
      content: "a",
      savedContent: "a",
      kind: "text",
      writable: false,
      isDirty: false,
      markdownViewMode: "edit",
      scrollState: {
        editorScrollTop: 0,
        previewScrollTop: 0,
      },
    },
  );
});

test("buildUntitledTab creates a clean markdown editor tab", () => {
  assert.deepEqual(buildUntitledTab(), {
    path: null,
    content: "",
    savedContent: "",
    kind: "markdown",
    writable: true,
    isDirty: false,
    markdownViewMode: "edit",
    scrollState: {
      editorScrollTop: 0,
      previewScrollTop: 0,
    },
  });
});

test("snapshotActiveStateAsTab normalizes active file state", () => {
  assert.deepEqual(
    snapshotActiveStateAsTab({
      activePath: "/notes.md",
      activeKind: "markdown",
      content: "# Notes",
      isDirty: true,
      markdownViewMode: "preview",
      activeEditorScrollTop: 12,
      activePreviewScrollTop: 34,
    }),
    {
      path: "/notes.md",
      content: "# Notes",
      savedContent: "# Notes",
      kind: "markdown",
      writable: true,
      isDirty: true,
      markdownViewMode: "preview",
      scrollState: {
        editorScrollTop: 12,
        previewScrollTop: 34,
      },
    },
  );
});

test("switchToSingleFileState clears file browser context and applies payload", () => {
  const state = {
    mode: "folder",
    sidebarVisible: true,
    rootPath: "/project",
    entries: [{ path: "/project/a.md" }],
    openFiles: [{ path: "/project/a.md" }],
    activeTabIndex: 3,
  };
  const calls = [];

  switchToSingleFileState({
    state,
    payload: { path: "/tmp/a.md" },
    markSidebarTreeDirty: () => calls.push("dirty"),
    applyFilePayload: (payload, options) => calls.push({ payload, options }),
  });

  assert.equal(state.mode, "file");
  assert.equal(state.sidebarVisible, false);
  assert.equal(state.rootPath, null);
  assert.deepEqual(state.entries, []);
  assert.deepEqual(state.openFiles, []);
  assert.equal(state.activeTabIndex, 0);
  assert.deepEqual(calls, [
    "dirty",
    {
      payload: { path: "/tmp/a.md" },
      options: { defaultMarkdownMode: "preview" },
    },
  ]);
});

test("switchToMultiTabFileState clears folder context and installs tabs", () => {
  const state = {
    mode: "folder",
    sidebarVisible: true,
    rootPath: "/project",
    entries: [{ path: "/project/a.md" }],
    openFiles: [],
    activeTabIndex: 0,
  };
  const tabs = [{ path: "/tmp/a.md" }, { path: "/tmp/b.md" }];
  let markedDirty = 0;

  switchToMultiTabFileState({
    state,
    tabs,
    activeTabIndex: 1,
    markSidebarTreeDirty: () => {
      markedDirty += 1;
    },
  });

  assert.equal(state.mode, "files");
  assert.equal(state.sidebarVisible, false);
  assert.equal(state.rootPath, null);
  assert.deepEqual(state.entries, []);
  assert.equal(state.openFiles, tabs);
  assert.equal(state.activeTabIndex, 1);
  assert.equal(markedDirty, 1);
});
