import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clearAllSessions,
  loadAllSessions,
  pruneStaleWindows,
  saveWindowSession,
} from "../../src/app/session-persistence.js";

function createMockStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
    keys() {
      return [...store.keys()];
    },
  };
}

function createState(overrides = {}) {
  return {
    mode: "files",
    rootPath: null,
    openFiles: [],
    activeTabIndex: 0,
    activePath: null,
    markdownViewMode: "preview",
    ...overrides,
  };
}

describe("saveWindowSession", () => {
  it("saves session for a window and registers label", () => {
    const storage = createMockStorage();
    const state = createState({
      openFiles: [
        { path: "/a.md", markdownViewMode: "preview" },
        { path: "/b.txt", markdownViewMode: "edit" },
      ],
      activeTabIndex: 1,
    });

    saveWindowSession(state, "win-1", storage);

    const labels = JSON.parse(storage.getItem("teex-session-labels"));
    assert.deepEqual(labels, ["win-1"]);

    const saved = JSON.parse(storage.getItem("teex-session:win-1"));
    assert.equal(saved.version, 1);
    assert.equal(saved.mode, "files");
    assert.equal(saved.tabs.length, 2);
    assert.equal(saved.activeTabIndex, 1);
  });

  it("saves folder session with rootPath", () => {
    const storage = createMockStorage();
    const state = createState({
      mode: "folder",
      rootPath: "/projects/my-app",
      entries: [
        {
          path: "/projects/my-app/docs/guide.md",
          relPath: "docs/guide.md",
        },
        {
          path: "/projects/my-app/docs/api/ref.md",
          relPath: "docs/api/ref.md",
        },
      ],
      collapsedFolders: new Set(["docs/api"]),
      openFiles: [
        { path: "/projects/my-app/index.js", markdownViewMode: "edit" },
      ],
    });

    saveWindowSession(state, "win-1", storage);

    const saved = JSON.parse(storage.getItem("teex-session:win-1"));
    assert.equal(saved.mode, "folder");
    assert.equal(saved.folderPath, "/projects/my-app");
    assert.deepEqual(saved.expandedFolders, ["docs"]);
  });

  it("skips untitled tabs (null path)", () => {
    const storage = createMockStorage();
    const state = createState({
      openFiles: [
        { path: null, markdownViewMode: "edit" },
        { path: "/real.md", markdownViewMode: "preview" },
      ],
    });

    saveWindowSession(state, "win-1", storage);

    const saved = JSON.parse(storage.getItem("teex-session:win-1"));
    assert.equal(saved.tabs.length, 1);
    assert.equal(saved.tabs[0].path, "/real.md");
  });

  it("removes entry when mode is empty", () => {
    const storage = createMockStorage();
    saveWindowSession(
      createState({
        openFiles: [{ path: "/a.md", markdownViewMode: "preview" }],
      }),
      "win-1",
      storage,
    );
    assert.ok(storage.getItem("teex-session:win-1"));

    saveWindowSession(createState({ mode: "empty" }), "win-1", storage);

    assert.equal(storage.getItem("teex-session:win-1"), null);
    const labels = JSON.parse(storage.getItem("teex-session-labels"));
    assert.ok(!labels.includes("win-1"));
  });

  it("removes entry when no tabs have paths", () => {
    const storage = createMockStorage();
    saveWindowSession(
      createState({
        openFiles: [{ path: "/a.md", markdownViewMode: "preview" }],
      }),
      "win-1",
      storage,
    );

    saveWindowSession(
      createState({ openFiles: [{ path: null }] }),
      "win-1",
      storage,
    );

    assert.equal(storage.getItem("teex-session:win-1"), null);
  });

  it("saves single-file mode using activePath", () => {
    const storage = createMockStorage();
    const state = createState({
      mode: "file",
      openFiles: [],
      activePath: "/single.md",
      markdownViewMode: "edit",
    });

    saveWindowSession(state, "win-1", storage);

    const saved = JSON.parse(storage.getItem("teex-session:win-1"));
    assert.equal(saved.tabs.length, 1);
    assert.equal(saved.tabs[0].path, "/single.md");
  });

  it("does not duplicate label on repeated saves", () => {
    const storage = createMockStorage();
    const state = createState({
      openFiles: [{ path: "/a.md", markdownViewMode: "preview" }],
    });

    saveWindowSession(state, "win-1", storage);
    saveWindowSession(state, "win-1", storage);

    const labels = JSON.parse(storage.getItem("teex-session-labels"));
    assert.deepEqual(labels, ["win-1"]);
  });
});

describe("loadAllSessions", () => {
  it("returns empty array when nothing stored", () => {
    const storage = createMockStorage();
    assert.deepEqual(loadAllSessions(storage), []);
  });

  it("returns sessions from multiple windows", () => {
    const storage = createMockStorage();
    saveWindowSession(
      createState({
        openFiles: [{ path: "/a.md", markdownViewMode: "preview" }],
      }),
      "win-1",
      storage,
    );
    saveWindowSession(
      createState({
        mode: "folder",
        rootPath: "/project",
        openFiles: [{ path: "/project/b.md", markdownViewMode: "edit" }],
      }),
      "win-2",
      storage,
    );

    const sessions = loadAllSessions(storage);
    assert.equal(sessions.length, 2);
    assert.equal(sessions[0].tabs[0].path, "/a.md");
    assert.equal(sessions[1].mode, "folder");
    assert.deepEqual(sessions[1].expandedFolders, []);
  });

  it("skips entries with invalid expandedFolders payload", () => {
    const storage = createMockStorage();
    storage.setItem("teex-session-labels", JSON.stringify(["win-1"]));
    storage.setItem(
      "teex-session:win-1",
      JSON.stringify({
        version: 1,
        tabs: [{ path: "/a.md" }],
        expandedFolders: "docs",
      }),
    );

    assert.deepEqual(loadAllSessions(storage), []);
  });

  it("skips corrupt entries", () => {
    const storage = createMockStorage();
    storage.setItem(
      "teex-session-labels",
      JSON.stringify(["win-1", "win-bad"]),
    );
    storage.setItem(
      "teex-session:win-1",
      JSON.stringify({ version: 1, tabs: [{ path: "/a.md" }] }),
    );
    storage.setItem("teex-session:win-bad", "not json{{{");

    const sessions = loadAllSessions(storage);
    assert.equal(sessions.length, 1);
  });
});

describe("pruneStaleWindows", () => {
  it("removes sessions for windows no longer alive", () => {
    const storage = createMockStorage();
    saveWindowSession(
      createState({
        openFiles: [{ path: "/a.md", markdownViewMode: "preview" }],
      }),
      "win-1",
      storage,
    );
    saveWindowSession(
      createState({
        openFiles: [{ path: "/b.md", markdownViewMode: "preview" }],
      }),
      "win-2",
      storage,
    );

    pruneStaleWindows(["win-1"], storage);

    const labels = JSON.parse(storage.getItem("teex-session-labels"));
    assert.deepEqual(labels, ["win-1"]);
    assert.equal(storage.getItem("teex-session:win-2"), null);
    assert.ok(storage.getItem("teex-session:win-1"));
  });
});

describe("clearAllSessions", () => {
  it("removes all session data", () => {
    const storage = createMockStorage();
    saveWindowSession(
      createState({
        openFiles: [{ path: "/a.md", markdownViewMode: "preview" }],
      }),
      "win-1",
      storage,
    );
    saveWindowSession(
      createState({
        openFiles: [{ path: "/b.md", markdownViewMode: "preview" }],
      }),
      "win-2",
      storage,
    );

    clearAllSessions(storage);

    assert.equal(storage.getItem("teex-session-labels"), null);
    assert.equal(storage.getItem("teex-session:win-1"), null);
    assert.equal(storage.getItem("teex-session:win-2"), null);
  });
});

describe("round-trip", () => {
  it("save then load returns correct data for multiple windows", () => {
    const storage = createMockStorage();
    saveWindowSession(
      createState({
        openFiles: [
          { path: "/one.md", markdownViewMode: "preview" },
          { path: "/two.txt", markdownViewMode: "edit" },
        ],
        activeTabIndex: 1,
      }),
      "win-1",
      storage,
    );
    saveWindowSession(
      createState({
        mode: "folder",
        rootPath: "/project",
        entries: [
          { path: "/project/docs/readme.md", relPath: "docs/readme.md" },
          { path: "/project/src/main.js", relPath: "src/main.js" },
        ],
        collapsedFolders: new Set(["src"]),
        openFiles: [
          { path: "/project/readme.md", markdownViewMode: "preview" },
        ],
      }),
      "win-2",
      storage,
    );

    const sessions = loadAllSessions(storage);
    assert.equal(sessions.length, 2);
    assert.equal(sessions[0].tabs.length, 2);
    assert.equal(sessions[0].activeTabIndex, 1);
    assert.equal(sessions[1].mode, "folder");
    assert.equal(sessions[1].folderPath, "/project");
    assert.deepEqual(sessions[1].expandedFolders, ["docs"]);
  });
});
