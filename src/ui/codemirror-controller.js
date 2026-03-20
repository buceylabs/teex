import {
  bracketMatching,
  Compartment,
  Decoration,
  defaultKeymap,
  drawSelection,
  EditorState,
  EditorView,
  HighlightStyle,
  highlightSelectionMatches,
  highlightSpecialChars,
  history,
  historyKeymap,
  indentOnInput,
  indentWithTab,
  keymap,
  lineNumbers,
  RangeSet,
  StateEffect,
  StateField,
  syntaxHighlighting,
  tags,
} from "/vendor/codemirror.js";
import { languageForExtension } from "./codemirror-languages.js";

const setDiffEffect = StateEffect.define();

const diffField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(decos, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setDiffEffect)) return effect.value;
    }
    return decos;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const diffAdded = Decoration.line({ class: "cm-diff-added" });
const diffRemoved = Decoration.line({ class: "cm-diff-removed" });
const diffModified = Decoration.line({ class: "cm-diff-modified" });

const DIFF_TYPES = {
  added: diffAdded,
  removed: diffRemoved,
  modified: diffModified,
};

function buildDarkHighlightStyle() {
  return HighlightStyle.define([
    { tag: tags.comment, color: "#5c6370" },
    { tag: tags.lineComment, color: "#5c6370" },
    { tag: tags.blockComment, color: "#5c6370" },
    { tag: tags.docComment, color: "#5c6370" },
    {
      tag: [tags.punctuation, tags.bracket, tags.separator],
      color: "#abb2bf",
    },
    { tag: [tags.propertyName, tags.labelName], color: "#d19a66" },
    { tag: [tags.tagName], color: "#e06c75" },
    {
      tag: [tags.bool, tags.number, tags.integer, tags.float],
      color: "#d19a66",
    },
    { tag: [tags.atom, tags.constant(tags.variableName)], color: "#d19a66" },
    {
      tag: [tags.string, tags.character, tags.special(tags.string)],
      color: "#98c379",
    },
    { tag: [tags.attributeName], color: "#d19a66" },
    { tag: [tags.attributeValue], color: "#98c379" },
    { tag: [tags.operator, tags.url], color: "#56b6c2" },
    {
      tag: [tags.keyword, tags.modifier, tags.operatorKeyword],
      color: "#c678dd",
    },
    { tag: [tags.controlKeyword], color: "#c678dd" },
    { tag: [tags.definitionKeyword], color: "#c678dd" },
    {
      tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
      color: "#61afef",
    },
    {
      tag: [tags.className, tags.definition(tags.typeName)],
      color: "#61afef",
    },
    { tag: [tags.typeName], color: "#e5c07b" },
    { tag: [tags.variableName], color: "#e06c75" },
    { tag: [tags.definition(tags.variableName)], color: "#e06c75" },
    { tag: [tags.regexp], color: "#e06c75" },
    { tag: [tags.self], color: "#e06c75" },
  ]);
}

function buildLightHighlightStyle() {
  return HighlightStyle.define([
    { tag: tags.comment, color: "#6a737d" },
    { tag: tags.lineComment, color: "#6a737d" },
    { tag: tags.blockComment, color: "#6a737d" },
    { tag: tags.docComment, color: "#6a737d" },
    {
      tag: [tags.punctuation, tags.bracket, tags.separator],
      color: "#6b7280",
    },
    { tag: [tags.propertyName, tags.labelName], color: "#986801" },
    { tag: [tags.tagName], color: "#e45649" },
    {
      tag: [tags.bool, tags.number, tags.integer, tags.float],
      color: "#986801",
    },
    { tag: [tags.atom, tags.constant(tags.variableName)], color: "#986801" },
    {
      tag: [tags.string, tags.character, tags.special(tags.string)],
      color: "#50a14f",
    },
    { tag: [tags.attributeName], color: "#986801" },
    { tag: [tags.attributeValue], color: "#50a14f" },
    { tag: [tags.operator, tags.url], color: "#0184bc" },
    {
      tag: [tags.keyword, tags.modifier, tags.operatorKeyword],
      color: "#a626a4",
    },
    { tag: [tags.controlKeyword], color: "#a626a4" },
    { tag: [tags.definitionKeyword], color: "#a626a4" },
    {
      tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
      color: "#4078f2",
    },
    {
      tag: [tags.className, tags.definition(tags.typeName)],
      color: "#4078f2",
    },
    { tag: [tags.typeName], color: "#b08800" },
    { tag: [tags.variableName], color: "#e45649" },
    { tag: [tags.definition(tags.variableName)], color: "#e45649" },
    { tag: [tags.regexp], color: "#e45649" },
    { tag: [tags.self], color: "#e45649" },
  ]);
}

export function createCodeMirrorController({
  el,
  state,
  onContentChange,
  onScroll,
}) {
  let view = null;
  let currentLanguage = null;
  let isSyncing = false;
  const langCompartment = new Compartment();
  const highlightCompartment = new Compartment();

  function isDark() {
    const explicit = document.documentElement.getAttribute("data-theme");
    if (explicit) return explicit === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function currentHighlightExt() {
    const style = isDark()
      ? buildDarkHighlightStyle()
      : buildLightHighlightStyle();
    return syntaxHighlighting(style);
  }

  function attach(extension) {
    const lang = languageForExtension(extension);
    const langKey = extension ?? "";
    if (view && currentLanguage === langKey) return;

    detach();
    currentLanguage = langKey;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !isSyncing) {
        state.content = update.state.doc.toString();
        state.isDirty = state.content !== state.savedContent;
        if (typeof onContentChange === "function") onContentChange();
      }
    });

    const scrollListener = EditorView.domEventHandlers({
      scroll() {
        if (typeof onScroll === "function") onScroll();
      },
    });

    view = new EditorView({
      parent: el.codeEditor,
      state: EditorState.create({
        doc: "",
        extensions: [
          lineNumbers(),
          drawSelection(),
          highlightSpecialChars(),
          indentOnInput(),
          bracketMatching(),
          highlightSelectionMatches(),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          langCompartment.of(lang ? lang : []),
          highlightCompartment.of(currentHighlightExt()),
          diffField,
          updateListener,
          scrollListener,
          EditorView.lineWrapping,
        ],
      }),
    });

    el.codeEditor.classList.remove("hidden");
  }

  function detach() {
    if (view) {
      view.destroy();
      view = null;
    }
    currentLanguage = null;
    if (el.codeEditor) {
      el.codeEditor.classList.add("hidden");
      el.codeEditor.textContent = "";
    }
  }

  function syncContent(content) {
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== content) {
      isSyncing = true;
      view.dispatch({
        changes: { from: 0, to: current.length, insert: content },
      });
      isSyncing = false;
    }
  }

  function focus() {
    if (view) view.focus();
  }

  function isAttached() {
    return view !== null;
  }

  function setDiffDecorations(annotations) {
    if (!view) return;
    const doc = view.state.doc;
    const decos = [];
    for (const ann of annotations) {
      if (ann.line < 1 || ann.line > doc.lines) continue;
      const deco = DIFF_TYPES[ann.diff_type];
      if (!deco) continue;
      const lineObj = doc.line(ann.line);
      decos.push(deco.range(lineObj.from));
    }
    view.dispatch({
      effects: setDiffEffect.of(RangeSet.of(decos, true)),
    });
  }

  function clearDiffDecorations() {
    if (!view) return;
    view.dispatch({
      effects: setDiffEffect.of(Decoration.none),
    });
  }

  function refreshTheme() {
    if (!view) return;
    view.dispatch({
      effects: highlightCompartment.reconfigure(currentHighlightExt()),
    });
  }

  // Watch for theme changes
  const themeObserver = new MutationObserver(() => refreshTheme());
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => refreshTheme());

  return {
    attach,
    detach,
    syncContent,
    focus,
    isAttached,
    setDiffDecorations,
    clearDiffDecorations,
  };
}
