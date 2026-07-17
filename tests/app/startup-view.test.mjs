import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStartupTabHtml,
  startupViewFromPayload,
} from "../../src/app/startup-view.js";

test("startupViewFromPayload exposes a preloaded file immediately", () => {
  assert.deepEqual(
    startupViewFromPayload({
      context: {
        mode: "file",
        path: "/notes/start.md",
        paths: [],
      },
      file: {
        path: "/notes/start.md",
        content: "# Start",
        kind: "markdown",
        writable: true,
      },
    }),
    {
      hasDocument: true,
      title: "start.md",
      path: "/notes/start.md",
      content: "# Start",
    },
  );
});

test("startupViewFromPayload shows an untitled document for empty launches", () => {
  assert.deepEqual(
    startupViewFromPayload({
      context: { mode: "empty", path: null, paths: [] },
      file: null,
    }),
    {
      hasDocument: true,
      title: "Untitled",
      path: null,
      content: "",
    },
  );
});

test("startupViewFromPayload does not invent a document for folder launches", () => {
  assert.deepEqual(
    startupViewFromPayload({
      context: { mode: "folder", path: "/project", paths: [] },
      file: null,
    }),
    {
      hasDocument: false,
      title: "Teex",
      path: null,
      content: "",
    },
  );
});

test("buildStartupTabHtml escapes labels and paths", () => {
  const html = buildStartupTabHtml({
    title: "<start>.md",
    path: '/notes/"start".md',
  });

  assert.match(html, /&lt;start&gt;\.md/);
  assert.match(html, /&quot;start&quot;/);
  assert.doesNotMatch(html, /<start>/);
});
