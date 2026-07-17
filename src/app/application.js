import { createFindController } from "../search/find-controller.js";
import { buildCollapsedFoldersFromExpanded } from "../sidebar/tree.js";
import { reconcileRestoredFolderTabs } from "../tabs/session.js";
import { bindElements } from "../ui/bindings-controller.js";
import { createDiffController } from "../ui/diff/controller.js";
import { createDiffMapController } from "../ui/diff/map-controller.js";
import { createUnifiedDiffController } from "../ui/diff/unified-controller.js";
import { createDeferredEditorController } from "../ui/editor/deferred-controller.js";
import { createFormatController } from "../ui/format-controller.js";
import { confirmReloadExternalChange } from "../ui/native-dialog.js";
import { createScrollSyncController } from "../ui/scroll/sync.js";
import { baseName } from "../utils/app-utils.js";
import { createApplicationActions } from "./application-actions.js";
import { setupControllers } from "./controller-setup.js";
import { createExternalFileWatchController } from "./external-file-watch-controller.js";
import {
  applySavedModifiedOnly,
  applySavedShowHiddenFiles,
  applySavedSidebarWidth,
  applySavedStatusBar,
  applySavedTheme,
  listenForThemeEvents,
  syncSavedPreferencesToBackend,
} from "./preferences.js";
import { createRuntimeState, EVENTS } from "./runtime-state.js";
import {
  clearAllSessions,
  loadAllSessions,
  pruneStaleWindows,
} from "./session-persistence.js";
import { createSessionRestoreController } from "./session-restore.js";
import { createApplicationStateActions } from "./state-actions.js";

const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;
const runtime = createRuntimeState();
const {
  state,
  el,
  sidebarRenderState,
  sidebarClickState,
  osOpenDeduper,
  pendingOutgoingTabTransfers,
  dropOverlayDragState,
} = runtime;
const refs = {};
let started = false;

const stateActions = createApplicationStateActions({
  state,
  getScrollSync: () => refs.scrollSyncController,
});
const actions = createApplicationActions({
  state,
  el,
  invoke,
  refs,
  stateActions,
});
const codeEditorController = createDeferredEditorController({
  load: async () => {
    const { createCodeMirrorController } = await import(
      "../ui/editor/codemirror-controller.js"
    );
    return createCodeMirrorController({
      el,
      state,
      onContentChange: actions.renderChrome,
      onScroll: () => refs.scrollSyncController?.onEditorScroll(),
    });
  },
});

Object.assign(
  refs,
  setupControllers({
    state,
    el,
    invoke,
    listen,
    baseName,
    events: EVENTS,
    sidebarRenderState,
    sidebarClickState,
    osOpenDeduper,
    pendingOutgoingTabTransfers,
    dropOverlayDragState,
    codeEditorController,
    callbacks: {
      ...actions,
      toggleCollapseAllFolders: () =>
        refs.sidebarController.toggleCollapseAllFolders(),
      handleContextMenuDelete: (path) =>
        refs.tabController.deleteAndCloseTabs(path, {
          onAllClosed: () => refs.scrollSyncController?.afterContextCleared(),
        }),
      handleTabContextMenuClose: actions.closeTab,
      handleTabContextMenuCloseOthers: (index) =>
        refs.tabController.closeOtherTabs(index),
      onSavedStateChanged: actions.renderChrome,
    },
  }),
);

refs.sessionRestoreController = createSessionRestoreController({
  state,
  invoke,
  loadAllSessions,
  clearAllSessions,
  pruneStaleWindows,
  buildCollapsedFoldersFromExpanded,
  reconcileRestoredFolderTabs,
  markSidebarTreeDirty: actions.markSidebarTreeDirty,
  openFolder: actions.openFolder,
  openFile: actions.openFile,
  openMultipleFiles: actions.openMultipleFiles,
  openFolderEntryInTabs: actions.openFolderEntryInTabs,
  switchTab: actions.switchTab,
  render: actions.render,
});
refs.externalFileWatchController = createExternalFileWatchController({
  state,
  invoke,
  baseName,
  hasTabSession: actions.hasTabSession,
  applyFilePayload: actions.applyFilePayload,
  render: actions.render,
  updateMenuState: actions.updateMenuState,
  setStatus: actions.setStatus,
  confirmReloadExternalChange,
});

function initializeOptionalFeatures() {
  refs.findController = createFindController({
    state,
    el,
    codeEditorController,
  });
  refs.formatController = createFormatController({
    state,
    invoke,
    codeEditorController,
    onDirtyStateChanged: actions.renderChrome,
  });
  refs.diffMapController = createDiffMapController({
    el,
    codeEditorController,
  });
  refs.diffController = createDiffController({
    state,
    invoke,
    codeEditorController,
    diffMapController: refs.diffMapController,
  });
  refs.unifiedDiffController = createUnifiedDiffController({
    state,
    el,
    invoke,
  });
  refs.diffController.scheduleRefresh();
}

export async function startApplication({ startupPayload = null } = {}) {
  if (started) return;
  started = true;

  applySavedTheme();
  applySavedSidebarWidth(state);
  applySavedStatusBar(state);
  applySavedShowHiddenFiles(state);
  applySavedModifiedOnly(state);
  bindElements(el);
  actions.bindUiEvents();
  refs.scrollSyncController = createScrollSyncController({ state, el });

  syncSavedPreferencesToBackend(state, invoke);
  listenForThemeEvents(listen);
  invoke("get_folder_icon")
    .then((url) => {
      if (url) state.folderIconUrl = url;
    })
    .catch(() => {});

  await refs.openPathsController.bootstrap(startupPayload);
  initializeOptionalFeatures();
  await refs.appEventsController.bindAppEvents();
  actions.enableSessionSave();
  refs.openPathsController.startPendingOpenPathPoller();

  listen("teex://toggle-hidden-files", actions.toggleHiddenFiles);
  listen("teex://toggle-modified-only", actions.toggleModifiedOnly);
  listen("teex://toggle-unified-diff", actions.toggleUnifiedDiff);

  document.documentElement.dataset.startupPhase = "hydrated";
  performance.mark("teex:application-hydrated");
  performance.measure(
    "teex:document-visible",
    "teex:startup-entry",
    "teex:document-visible",
  );
  performance.measure(
    "teex:application-hydrated",
    "teex:startup-entry",
    "teex:application-hydrated",
  );
}
