const NOOP = () => {};
const ZERO = () => 0;
const FALSE = () => false;

export function createDeferredEditorController({ load }) {
  let controller = null;
  let loadPromise = null;

  function loadController() {
    if (controller) {
      return Promise.resolve(controller);
    }

    if (!loadPromise) {
      loadPromise = Promise.resolve()
        .then(() => load())
        .then((loaded) => {
          controller = loaded;
          return loaded;
        })
        .catch((error) => {
          loadPromise = null;
          throw error;
        });
    }

    return loadPromise;
  }

  function call(method, fallback = NOOP) {
    return (...args) => {
      const target = controller?.[method];
      return typeof target === "function"
        ? target.apply(controller, args)
        : fallback(...args);
    };
  }

  return {
    load: loadController,
    isLoaded: () => controller !== null,
    attach: call("attach"),
    detach: call("detach"),
    syncContent: call("syncContent"),
    focus: call("focus"),
    isAttached: call("isAttached", FALSE),
    setDiffDecorations: call("setDiffDecorations"),
    clearDiffDecorations: call("clearDiffDecorations"),
    scrollToLine: call("scrollToLine"),
    getLineCount: call("getLineCount", ZERO),
    search: call("search"),
    searchNext: call("searchNext"),
    searchPrev: call("searchPrev"),
    clearSearch: call("clearSearch"),
  };
}
