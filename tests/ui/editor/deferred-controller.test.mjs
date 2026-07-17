import assert from "node:assert/strict";
import test from "node:test";

import { createDeferredEditorController } from "../../../src/ui/editor/deferred-controller.js";

function createLoadedController(callLog) {
  return {
    attach: (...args) => callLog.push(["attach", ...args]),
    detach: (...args) => callLog.push(["detach", ...args]),
    syncContent: (...args) => callLog.push(["syncContent", ...args]),
    focus: (...args) => callLog.push(["focus", ...args]),
    isAttached: () => true,
    setDiffDecorations: (...args) =>
      callLog.push(["setDiffDecorations", ...args]),
    clearDiffDecorations: (...args) =>
      callLog.push(["clearDiffDecorations", ...args]),
    scrollToLine: (...args) => callLog.push(["scrollToLine", ...args]),
    getLineCount: () => 42,
    search: (...args) => callLog.push(["search", ...args]),
    searchNext: (...args) => callLog.push(["searchNext", ...args]),
    searchPrev: (...args) => callLog.push(["searchPrev", ...args]),
    clearSearch: (...args) => callLog.push(["clearSearch", ...args]),
  };
}

test("deferred editor does not load the enhanced editor until requested", async () => {
  let loadCalls = 0;
  const controller = createDeferredEditorController({
    load: async () => {
      loadCalls += 1;
      return createLoadedController([]);
    },
  });

  assert.equal(loadCalls, 0);
  assert.equal(controller.isLoaded(), false);
  assert.equal(controller.isAttached(), false);
  assert.equal(controller.getLineCount(), 0);

  await controller.load();

  assert.equal(loadCalls, 1);
  assert.equal(controller.isLoaded(), true);
});

test("deferred editor coalesces concurrent loads and forwards calls after loading", async () => {
  let loadCalls = 0;
  const calls = [];
  const loaded = createLoadedController(calls);
  const controller = createDeferredEditorController({
    load: async () => {
      loadCalls += 1;
      return loaded;
    },
  });

  const [first, second] = await Promise.all([
    controller.load(),
    controller.load(),
  ]);

  assert.equal(loadCalls, 1);
  assert.equal(first, loaded);
  assert.equal(second, loaded);

  controller.attach("js");
  controller.syncContent("const ready = true;");
  controller.focus();
  controller.search("ready");

  assert.deepEqual(calls, [
    ["attach", "js"],
    ["syncContent", "const ready = true;"],
    ["focus"],
    ["search", "ready"],
  ]);
  assert.equal(controller.isAttached(), true);
  assert.equal(controller.getLineCount(), 42);
});

test("deferred editor safely ignores optional calls before loading", () => {
  const controller = createDeferredEditorController({
    load: async () => createLoadedController([]),
  });

  controller.detach();
  controller.syncContent("not loaded");
  controller.focus();
  controller.setDiffDecorations([]);
  controller.clearDiffDecorations();
  controller.scrollToLine(10);
  controller.search("query");
  controller.searchNext();
  controller.searchPrev();
  controller.clearSearch();

  assert.equal(controller.isLoaded(), false);
});
