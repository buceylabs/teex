// CodeMirror 6 vendor bundle entry point
// Run `node build.mjs` from this directory to regenerate src/vendor/codemirror.js

// Core
export {
  EditorView,
  lineNumbers,
  keymap,
  Decoration,
  ViewPlugin,
  WidgetType,
  drawSelection,
  highlightActiveLine,
  highlightSpecialChars,
} from "@codemirror/view";

export {
  EditorState,
  StateField,
  StateEffect,
  Compartment,
  RangeSet,
} from "@codemirror/state";

export {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";

export {
  syntaxHighlighting,
  HighlightStyle,
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap,
  defaultHighlightStyle,
  StreamLanguage,
} from "@codemirror/language";

export { tags } from "@lezer/highlight";

export {
  search,
  searchKeymap,
  openSearchPanel,
  closeSearchPanel,
  highlightSelectionMatches,
  SearchQuery,
  setSearchQuery,
  findNext,
  findPrevious,
  searchPanelOpen,
} from "@codemirror/search";

// Language packages
export { javascript } from "@codemirror/lang-javascript";
export { python } from "@codemirror/lang-python";
export { rust } from "@codemirror/lang-rust";
export { json } from "@codemirror/lang-json";
export { html } from "@codemirror/lang-html";
export { css } from "@codemirror/lang-css";
export { xml } from "@codemirror/lang-xml";
export { yaml } from "@codemirror/lang-yaml";
export { sql } from "@codemirror/lang-sql";
export { go } from "@codemirror/lang-go";
export { java } from "@codemirror/lang-java";
export { cpp } from "@codemirror/lang-cpp";
export { php } from "@codemirror/lang-php";
export { markdown } from "@codemirror/lang-markdown";

// Legacy modes for languages without dedicated packages
export { ruby } from "@codemirror/legacy-modes/mode/ruby";
export { lua } from "@codemirror/legacy-modes/mode/lua";
export { swift } from "@codemirror/legacy-modes/mode/swift";
export {
  kotlin,
  scala,
  csharp,
  dart,
} from "@codemirror/legacy-modes/mode/clike";
export { shell } from "@codemirror/legacy-modes/mode/shell";
export { toml } from "@codemirror/legacy-modes/mode/toml";
