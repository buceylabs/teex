export function createDiffController({
  state,
  invoke,
  codeEditorController,
  diffMapController,
}) {
  let debounceTimer = null;

  async function refresh() {
    const path = state.activePath;

    if (!path || state.activeKind !== "code") {
      codeEditorController.clearDiffDecorations();
      diffMapController?.hide();
      return;
    }

    try {
      const annotations = await invoke("git_diff", { path });
      // Only apply if the active file hasn't changed during the async call
      if (state.activePath === path) {
        codeEditorController.setDiffDecorations(annotations);
        diffMapController?.update(
          annotations,
          codeEditorController.getLineCount(),
        );
      }
    } catch {
      codeEditorController.clearDiffDecorations();
      diffMapController?.hide();
    }
  }

  function scheduleRefresh() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(refresh, 300);
  }

  function clear() {
    clearTimeout(debounceTimer);
    codeEditorController.clearDiffDecorations();
    diffMapController?.hide();
  }

  return { refresh, scheduleRefresh, clear };
}
