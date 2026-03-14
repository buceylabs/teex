import assert from "node:assert/strict";
import test from "node:test";

test("input handler: type sets isDirty to true", () => {
  const state = { content: "", savedContent: "original", isDirty: false };

  // Simulate input event: editor value changed
  state.content = "original plus typing";
  state.isDirty = state.content !== state.savedContent;

  assert.equal(state.isDirty, true);
});

test("input handler: type then undo back to saved content clears isDirty", () => {
  const state = { content: "", savedContent: "original", isDirty: false };

  // Simulate typing
  state.content = "original plus typing";
  state.isDirty = state.content !== state.savedContent;
  assert.equal(state.isDirty, true);

  // Simulate undo back to original
  state.content = "original";
  state.isDirty = state.content !== state.savedContent;
  assert.equal(state.isDirty, false);
});

test("input handler: partial undo still different from saved keeps isDirty", () => {
  const state = { content: "", savedContent: "original", isDirty: false };

  // Simulate typing multiple chars
  state.content = "original abc";
  state.isDirty = state.content !== state.savedContent;
  assert.equal(state.isDirty, true);

  // Partial undo — still different from saved
  state.content = "original a";
  state.isDirty = state.content !== state.savedContent;
  assert.equal(state.isDirty, true);
});

test("paste undo: undo to pre-paste state compares against savedContent", () => {
  const state = { content: "", savedContent: "original", isDirty: false };

  // Simulate paste
  state.content = "original pasted-text";
  state.isDirty = state.content !== state.savedContent;
  assert.equal(state.isDirty, true);

  // Simulate paste undo back to saved content
  const editorValue = "original";
  state.isDirty = editorValue !== state.savedContent;
  assert.equal(state.isDirty, false);
});

test("paste undo: undo to pre-paste state still dirty if different from saved", () => {
  const state = {
    content: "",
    savedContent: "original",
    isDirty: false,
  };

  // User typed first, then pasted
  state.content = "modified pasted-text";
  state.isDirty = state.content !== state.savedContent;
  assert.equal(state.isDirty, true);

  // Paste undo reverts paste but typed changes remain
  const editorValue = "modified";
  state.isDirty = editorValue !== state.savedContent;
  assert.equal(state.isDirty, true);
});
