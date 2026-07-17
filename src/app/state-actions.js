import {
  applyFilePayloadToState,
  clearActiveFileInState,
  flushStateToActiveTabInState,
  hasTabSession as hasTabSessionInState,
  normalizeTransferTab as normalizeTransferTabRecord,
  snapshotActiveFileAsTransferTab as snapshotActiveFileTransfer,
  snapshotAllOpenTabsForTransfer as snapshotAllTransfers,
  syncActiveTabToStateFromTabs,
} from "../tabs/session.js";

export function createApplicationStateActions({ state, getScrollSync }) {
  function applyFilePayload(payload, options) {
    getScrollSync()?.beforeApplyFilePayload();
    applyFilePayloadToState(state, payload, options);
    getScrollSync()?.afterApplyFilePayload(payload.path);
  }

  return {
    applyFilePayload,
    clearActiveFile: () => clearActiveFileInState(state),
    flushStateToActiveTab: () => flushStateToActiveTabInState(state),
    hasTabSession: () => hasTabSessionInState(state),
    normalizeTransferTab: (rawTab) => normalizeTransferTabRecord(rawTab),
    snapshotActiveFileAsTransferTab: () => snapshotActiveFileTransfer(state),
    snapshotAllOpenTabsForTransfer: () => snapshotAllTransfers(state),
    syncActiveTabToState: () => syncActiveTabToStateFromTabs(state),
  };
}
