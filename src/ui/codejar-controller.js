import { CodeJar } from "/vendor/codejar.js";
import { prismLanguageForExtension } from "./prism-languages.js";

function createHighlighter(language) {
  const grammar = language ? window.Prism?.languages[language] : null;
  if (!grammar) {
    return () => {};
  }
  return (el) => {
    el.innerHTML = window.Prism.highlight(el.textContent, grammar, language);
  };
}

export function createCodeJarController({
  el,
  state,
  onContentChange,
  onScroll,
}) {
  let jar = null;
  let currentExtension = null;
  let scrollHandler = null;

  function attach(extension) {
    if (jar && currentExtension === extension) {
      return;
    }

    detach();
    currentExtension = extension;

    const language = prismLanguageForExtension(extension);
    const highlight = createHighlighter(language);

    el.codeEditor.classList.remove("hidden");
    jar = CodeJar(el.codeEditor, highlight, {
      tab: "  ",
      spellcheck: false,
      addClosing: true,
    });

    jar.onUpdate((code) => {
      state.content = code;
      state.isDirty = state.content !== state.savedContent;
      if (typeof onContentChange === "function") {
        onContentChange();
      }
    });

    scrollHandler = () => {
      if (typeof onScroll === "function") {
        onScroll();
      }
    };
    el.codeEditor.addEventListener("scroll", scrollHandler);
  }

  function detach() {
    if (jar) {
      jar.destroy();
      jar = null;
    }
    if (scrollHandler) {
      el.codeEditor.removeEventListener("scroll", scrollHandler);
      scrollHandler = null;
    }
    currentExtension = null;
    if (el.codeEditor) {
      el.codeEditor.classList.add("hidden");
      el.codeEditor.textContent = "";
    }
  }

  function syncContent(content) {
    if (!jar) return;
    if (jar.toString() !== content) {
      jar.updateCode(content);
    }
  }

  function focus() {
    if (el.codeEditor) {
      el.codeEditor.focus();
    }
  }

  function isAttached() {
    return jar !== null;
  }

  return {
    attach,
    detach,
    syncContent,
    focus,
    isAttached,
  };
}
