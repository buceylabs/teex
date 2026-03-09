import { shouldShowTabBar } from "../ui/behavior.js";
import {
  flushStateToActiveTabInState,
  hasTabSession,
  normalizeTransferTab,
  snapshotActiveFileAsTransferTab,
} from "./session.js";

let nextDragId = 1;

export function createCrossWindowDragController({
  state,
  pendingOutgoingTabTransfers,
  invoke,
  el,
  render,
  setStatus,
}) {
  let dragId = null;
  let fromIndex = -1;
  let targetLabel = null;
  let reporting = false;

  function activate(index) {
    dragId = `cwdrag-${nextDragId++}`;
    fromIndex = index;
    targetLabel = null;
    reporting = false;
  }

  function isActive() {
    return dragId !== null;
  }

  function currentTargetLabel() {
    return targetLabel;
  }

  async function reportPosition(screenX, screenY) {
    if (!dragId || reporting) {
      return;
    }
    reporting = true;
    try {
      const physicalX = Math.round(screenX * window.devicePixelRatio);
      const physicalY = Math.round(screenY * window.devicePixelRatio);
      const result = await invoke("report_drag_position", {
        dragId,
        sourceLabel: state.windowLabel,
        physicalX,
        physicalY,
      });
      targetLabel = result ?? null;
    } catch {
      targetLabel = null;
    } finally {
      reporting = false;
    }
  }

  async function cancel() {
    if (!dragId) {
      return;
    }
    const id = dragId;
    dragId = null;
    fromIndex = -1;
    targetLabel = null;
    reporting = false;
    try {
      await invoke("cancel_cross_window_drag_hover", { dragId: id });
    } catch {
      // best-effort cleanup
    }
  }

  function snapshotSingleTab(index) {
    flushStateToActiveTabInState(state);
    if (hasTabSession(state)) {
      const tab = state.openFiles[index];
      if (!tab) {
        return null;
      }
      return normalizeTransferTab(tab);
    }
    return snapshotActiveFileAsTransferTab(state);
  }

  async function completeDrop() {
    if (!dragId || !targetLabel) {
      await cancel();
      return;
    }

    const tab = snapshotSingleTab(fromIndex);
    if (!tab) {
      await cancel();
      return;
    }

    const requestId = `cwdrag-transfer-${nextDragId++}`;
    pendingOutgoingTabTransfers.set(requestId, {
      kind: "single-drag",
      tabCount: 1,
      fromIndex,
    });

    const savedDragId = dragId;
    const savedTargetLabel = targetLabel;
    dragId = null;
    fromIndex = -1;
    targetLabel = null;
    reporting = false;

    try {
      await invoke("route_tab_transfer", {
        sourceLabel: state.windowLabel,
        targetLabel: savedTargetLabel,
        requestId,
        tabs: [tab],
      });
    } catch (error) {
      pendingOutgoingTabTransfers.delete(requestId);
      setStatus(String(error), true);
    }

    try {
      await invoke("cancel_cross_window_drag_hover", { dragId: savedDragId });
    } catch {
      // best-effort cleanup
    }
  }

  function showDropZone() {
    el.tabBar.classList.remove("hidden");
    el.tabBar.classList.add("tab-bar-drop-target");
  }

  function hideDropZone() {
    el.tabBar.classList.remove("tab-bar-drop-target");
    el.tabBar.classList.toggle("hidden", !shouldShowTabBar(state.openFiles.length));
  }

  function handleDragEnter() {
    showDropZone();
  }

  function handleDragLeave() {
    hideDropZone();
  }

  return {
    activate,
    isActive,
    currentTargetLabel,
    reportPosition,
    cancel,
    completeDrop,
    handleDragEnter,
    handleDragLeave,
  };
}
