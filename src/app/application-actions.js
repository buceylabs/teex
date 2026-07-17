import { recordNavigation } from "../tabs/navigation.js";
import { bindUiEvents as bindUiEventsImported } from "../ui/bindings-controller.js";
import {
  toggleHiddenFiles as toggleHiddenFilesPref,
  toggleModifiedOnly as toggleModifiedOnlyPref,
  toggleStatusBar as toggleStatusBarPref,
} from "./preferences.js";
import { saveWindowSession } from "./session-persistence.js";

export function createApplicationActions({
  state,
  el,
  invoke,
  refs,
  stateActions,
}) {
  let sessionSaveEnabled = false;

  function renderChrome() {
    refs.uiRenderer.renderChrome();
  }

  function setStatus(message, isError = false) {
    if (isError) console.error(message);
  }

  function markSidebarTreeDirty() {
    refs.sidebarController.markTreeDirty();
  }

  function updateMenuState() {
    refs.editorController.updateMenuState();
  }

  function render(options = {}) {
    refs.uiRenderer.render(options);
    refs.scrollSyncController?.scheduleRestoreAfterRender();
    refs.externalFileWatchController.syncWatchedProjectFiles();
    if (state.activeKind === "diff") {
      refs.diffController?.clear();
      refs.unifiedDiffController?.scheduleRefresh();
    } else {
      refs.diffController?.refreshNow();
    }
    updateUnifiedDiffButton();
    if (sessionSaveEnabled) {
      stateActions.flushStateToActiveTab();
      saveWindowSession(state, state.windowLabel);
      refs.sessionRestoreController.pruneStaleWindowsAsync();
    }
  }

  async function openFile(path) {
    refs.findController?.close();
    refs.scrollSyncController?.beforeContextReplace();
    await refs.fileController.openFile(path);
    invoke("add_recent_file", { path }).catch(() => {});
  }

  async function openFolder(path) {
    refs.scrollSyncController?.beforeContextReplace();
    await refs.fileController.openFolder(path);
    invoke("add_recent_folder", { path }).catch(() => {});
    if (!stateActions.hasTabSession() && state.activePath) {
      recordNavigation(state, state.activePath);
      renderChrome();
    }
  }

  async function openEntry(path) {
    await refs.fileController.openEntry(path);
    if (!stateActions.hasTabSession() && state.activePath) {
      recordNavigation(state, state.activePath);
      renderChrome();
    }
  }

  async function openMultipleFiles(paths) {
    refs.scrollSyncController?.beforeContextReplace();
    await refs.tabController.openMultipleFiles(paths);
    for (const path of paths) {
      invoke("add_recent_file", { path }).catch(() => {});
    }
  }

  async function openFileAsTab(path) {
    await refs.tabController.openFileAsTab(path);
    invoke("add_recent_file", { path }).catch(() => {});
  }

  function switchTab(index) {
    refs.findController?.close();
    refs.tabController.switchTab(index);
  }

  async function closeTab(index) {
    await refs.tabController.closeTab(index);
    if (!state.activePath) refs.scrollSyncController?.afterContextCleared();
  }

  async function closeTabByPath(path) {
    if (stateActions.hasTabSession()) {
      const index = state.openFiles.findIndex((tab) => tab.path === path);
      if (index !== -1) await closeTab(index);
    } else if (state.activePath === path) {
      await refs.tabController.closeSingleActiveFile();
      refs.scrollSyncController?.afterContextCleared();
    }
  }

  function toggleUnifiedDiff() {
    if (state.mode !== "folder") return;
    const existingIndex = state.openFiles.findIndex(
      (tab) => tab.kind === "diff",
    );
    if (existingIndex !== -1) {
      if (
        stateActions.hasTabSession() &&
        state.activeTabIndex === existingIndex
      ) {
        refs.tabController.closeTab(existingIndex);
      } else {
        switchTab(existingIndex);
        refs.unifiedDiffController?.refreshNow();
      }
      return;
    }
    refs.tabController.openDiffTab();
    refs.unifiedDiffController?.refreshNow();
  }

  function updateUnifiedDiffButton() {
    if (!el.unifiedDiffBtn) return;
    const active = state.activeKind === "diff";
    el.unifiedDiffBtn.setAttribute("aria-pressed", String(active));
    el.unifiedDiffBtn.classList.toggle("active", active);
  }

  function bindUiEvents() {
    return bindUiEventsImported({
      state,
      el,
      invoke,
      setStatus,
      toggleMarkdownMode: () => refs.editorController.toggleMarkdownMode(),
      toggleSidebarVisibility: () =>
        refs.editorController.toggleSidebarVisibility(),
      toggleStatusBar: () => toggleStatusBarPref(state, render),
      toggleModifiedOnly: () =>
        toggleModifiedOnlyPref(state, invoke, markSidebarTreeDirty, render),
      toggleCollapseAllFolders: () =>
        refs.sidebarController.toggleCollapseAllFolders(),
      toggleUnifiedDiff,
      saveNow: () => refs.editorController.saveNow(),
      hasTabSession: stateActions.hasTabSession,
      switchTab,
      navigateBack: () => refs.tabController.navigateBack(),
      navigateForward: () => refs.tabController.navigateForward(),
      onEditorScroll: () => refs.scrollSyncController?.onEditorScroll(),
      onPreviewScroll: () => refs.scrollSyncController?.onPreviewScroll(),
      onDirtyStateChanged: renderChrome,
      openFind: () => refs.findController?.open(),
      formatActiveFile: () => refs.formatController?.formatActiveFile(),
    });
  }

  return {
    ...stateActions,
    bindUiEvents,
    closeActiveFileOrWindow: () => refs.tabController.closeActiveFileOrWindow(),
    closeTab,
    closeTabByPath,
    createNewTab: () => refs.tabController.createNewTab(),
    enableSessionSave: () => {
      sessionSaveEnabled = true;
    },
    formatActiveFile: () => refs.formatController?.formatActiveFile(),
    handleDroppedPaths: (paths) =>
      refs.openPathsController.handleDroppedPaths(paths),
    handleOsOpenFiles: (paths) =>
      refs.openPathsController.handleOsOpenFiles(paths),
    handleProjectFileChanged: (path) =>
      refs.externalFileWatchController.handleProjectFileChanged(path),
    handleProjectFolderChanged: () =>
      refs.fileController.refreshOpenFolderEntries(),
    handleReceiveTransferredTabs: (payload) =>
      refs.tabTransferController.handleReceiveTransferredTabs(payload),
    handleRequestExportAllTabs: (payload) =>
      refs.tabTransferController.handleRequestExportAllTabs(payload),
    handleTabTransferResult: (payload) =>
      refs.tabTransferController.handleTabTransferResult(payload),
    markSidebarTreeDirty,
    moveTab: (fromIndex, toIndex) =>
      refs.tabController.moveTab(fromIndex, toIndex),
    navigateBack: () => refs.tabController.navigateBack(),
    navigateForward: () => refs.tabController.navigateForward(),
    onAfterToggleMarkdownMode: () => refs.findController?.refresh(),
    onBeforeToggleMarkdownMode: () =>
      refs.scrollSyncController?.captureMarkdownToggleAnchor(),
    onFileSaved: (path) => {
      refs.externalFileWatchController.onFileSaved(path);
      refs.diffController?.invalidate(path);
      refs.diffController?.scheduleRefresh();
    },
    openEntry,
    openFile,
    openFileAsTab,
    openFileInTabs: (path) => refs.tabController.openFileInTabs(path),
    openFind: () => refs.findController?.open(),
    openFolder,
    openFolderEntryInTabs: (path) =>
      refs.fileController.openFolderEntryInTabs(path),
    openMultipleFiles,
    openSingleFileFromUi: (path) =>
      refs.fileController.openSingleFileFromUi(path),
    render,
    renderChrome,
    restoreLastSession: () =>
      refs.sessionRestoreController.restoreLastSession(),
    saveNow: () => refs.editorController.saveNow(),
    setDropOverlayVisible: (visible) => {
      if (!el.dropOverlay || state.dropOverlayVisible === visible) return;
      state.dropOverlayVisible = visible;
      el.dropOverlay.classList.toggle("hidden", !visible);
    },
    setStatus,
    switchTab,
    toggleHiddenFiles: () =>
      toggleHiddenFilesPref(state, invoke, () =>
        refs.fileController.refreshOpenFolderEntries(),
      ),
    toggleMarkdownMode: () => refs.editorController.toggleMarkdownMode(),
    toggleModifiedOnly: () =>
      toggleModifiedOnlyPref(state, invoke, markSidebarTreeDirty, render),
    toggleSidebarVisibility: () =>
      refs.editorController.toggleSidebarVisibility(),
    toggleStatusBar: () => toggleStatusBarPref(state, render),
    toggleUnifiedDiff,
    updateMenuState,
  };
}
