import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  insertWithFormattingUndo,
  redoPasteFormatting,
  undoPasteFormatting,
} from "../../src/ui/paste-insert.js";

function createMockEditor(initialValue = "", selectionStart = 0) {
  return {
    value: initialValue,
    selectionStart,
    selectionEnd: selectionStart,
  };
}

describe("insertWithFormattingUndo", () => {
  it("inserts raw text only when formattedText is null", () => {
    const editor = createMockEditor();
    const result = insertWithFormattingUndo(editor, "hello", null);

    assert.equal(result.inserted, "raw");
    assert.equal(result.undoState, null);
    assert.equal(editor.value, "hello");
  });

  it("inserts raw text only when formattedText equals rawText", () => {
    const editor = createMockEditor();
    const result = insertWithFormattingUndo(editor, "same", "same");

    assert.equal(result.inserted, "raw");
    assert.equal(result.undoState, null);
    assert.equal(editor.value, "same");
  });

  it("inserts formatted text and returns undo state", () => {
    const editor = createMockEditor();
    const raw = '{"a":1}';
    const formatted = '{\n  "a": 1\n}';

    const result = insertWithFormattingUndo(editor, raw, formatted);

    assert.equal(result.inserted, "formatted");
    assert.equal(editor.value, formatted);
    assert.equal(result.undoState.phase, "formatted");
    assert.deepEqual(result.undoState.prePaste, {
      value: "",
      selStart: 0,
      selEnd: 0,
    });
    assert.equal(result.undoState.rawPaste.value, raw);
  });

  it("works when pasting into middle of existing text", () => {
    const editor = createMockEditor("abcdef", 3);
    const raw = '{"x":2}';
    const formatted = '{\n  "x": 2\n}';

    const result = insertWithFormattingUndo(editor, raw, formatted);

    assert.equal(result.inserted, "formatted");
    assert.equal(editor.value, `abc${formatted}def`);
    assert.equal(result.undoState.rawPaste.value, `abc${raw}def`);
    assert.deepEqual(result.undoState.prePaste, {
      value: "abcdef",
      selStart: 3,
      selEnd: 3,
    });
  });

  it("replaces selected text when pasting", () => {
    const editor = createMockEditor("abcdef", 1);
    editor.selectionEnd = 4;
    const raw = '{"x":2}';
    const formatted = '{\n  "x": 2\n}';

    const result = insertWithFormattingUndo(editor, raw, formatted);

    assert.equal(editor.value, `a${formatted}ef`);
    assert.equal(result.undoState.rawPaste.value, `a${raw}ef`);
    assert.deepEqual(result.undoState.prePaste, {
      value: "abcdef",
      selStart: 1,
      selEnd: 4,
    });
  });
});

describe("undoPasteFormatting", () => {
  it("first undo reverts formatted to raw text", () => {
    const editor = createMockEditor();
    const raw = '{"a":1}';
    const formatted = '{\n  "a": 1\n}';

    const { undoState } = insertWithFormattingUndo(editor, raw, formatted);
    assert.equal(editor.value, formatted);

    const next = undoPasteFormatting(editor, undoState);

    assert.equal(editor.value, raw);
    assert.equal(next.phase, "raw");
  });

  it("second undo reverts raw text to pre-paste state", () => {
    const editor = createMockEditor("existing");
    editor.selectionStart = 8;
    editor.selectionEnd = 8;
    const raw = '{"a":1}';
    const formatted = '{\n  "a": 1\n}';

    const { undoState } = insertWithFormattingUndo(editor, raw, formatted);
    const next = undoPasteFormatting(editor, undoState);
    const final = undoPasteFormatting(editor, next);

    assert.equal(editor.value, "existing");
    assert.equal(editor.selectionStart, 8);
    assert.equal(final.phase, "pre-paste");
  });

  it("returns null when undoState is null", () => {
    const editor = createMockEditor();
    assert.equal(undoPasteFormatting(editor, null), null);
  });

  it("places cursor correctly after each undo step", () => {
    const editor = createMockEditor("abcdef", 3);
    const raw = '{"x":2}';
    const formatted = '{\n  "x": 2\n}';

    const { undoState } = insertWithFormattingUndo(editor, raw, formatted);
    assert.equal(editor.selectionStart, 3 + formatted.length);

    const next = undoPasteFormatting(editor, undoState);
    assert.equal(editor.selectionStart, 3 + raw.length);

    undoPasteFormatting(editor, next);
    assert.equal(editor.selectionStart, 3);
  });

  it("returns null when phase is already pre-paste", () => {
    const editor = createMockEditor();
    const raw = '{"a":1}';
    const formatted = '{\n  "a": 1\n}';

    const { undoState } = insertWithFormattingUndo(editor, raw, formatted);
    const s1 = undoPasteFormatting(editor, undoState);
    const s2 = undoPasteFormatting(editor, s1);

    assert.equal(s2.phase, "pre-paste");
    assert.equal(undoPasteFormatting(editor, s2), null);
  });
});

describe("redoPasteFormatting", () => {
  it("first redo restores raw text from pre-paste", () => {
    const editor = createMockEditor();
    const raw = '{"a":1}';
    const formatted = '{\n  "a": 1\n}';

    const { undoState } = insertWithFormattingUndo(editor, raw, formatted);
    const s1 = undoPasteFormatting(editor, undoState);
    const s2 = undoPasteFormatting(editor, s1);

    assert.equal(editor.value, "");
    const next = redoPasteFormatting(editor, s2);

    assert.equal(editor.value, raw);
    assert.equal(next.phase, "raw");
  });

  it("second redo restores formatted text from raw", () => {
    const editor = createMockEditor();
    const raw = '{"a":1}';
    const formatted = '{\n  "a": 1\n}';

    const { undoState } = insertWithFormattingUndo(editor, raw, formatted);
    const s1 = undoPasteFormatting(editor, undoState);
    const s2 = undoPasteFormatting(editor, s1);

    const r1 = redoPasteFormatting(editor, s2);
    const r2 = redoPasteFormatting(editor, r1);

    assert.equal(editor.value, formatted);
    assert.equal(r2.phase, "formatted");
  });

  it("returns null when undoState is null", () => {
    const editor = createMockEditor();
    assert.equal(redoPasteFormatting(editor, null), null);
  });

  it("returns null when phase is already formatted", () => {
    const editor = createMockEditor();
    const raw = '{"a":1}';
    const formatted = '{\n  "a": 1\n}';

    const { undoState } = insertWithFormattingUndo(editor, raw, formatted);
    assert.equal(redoPasteFormatting(editor, undoState), null);
  });

  it("places cursor correctly after each redo step", () => {
    const editor = createMockEditor("abcdef", 3);
    const raw = '{"x":2}';
    const formatted = '{\n  "x": 2\n}';

    const { undoState } = insertWithFormattingUndo(editor, raw, formatted);
    const s1 = undoPasteFormatting(editor, undoState);
    const s2 = undoPasteFormatting(editor, s1);

    assert.equal(editor.selectionStart, 3);

    const r1 = redoPasteFormatting(editor, s2);
    assert.equal(editor.selectionStart, 3 + raw.length);

    redoPasteFormatting(editor, r1);
    assert.equal(editor.selectionStart, 3 + formatted.length);
  });
});
