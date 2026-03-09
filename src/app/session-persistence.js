const SESSION_LABELS_KEY = "teex-session-labels";
const SESSION_PREFIX = "teex-session:";
const VERSION = 1;

export function saveWindowSession(state, windowLabel, storage = localStorage) {
  const tabs = collectTabs(state);

  if (state.mode === "empty" || tabs.length === 0) {
    removeWindowSession(windowLabel, storage);
    return;
  }

  const session = {
    version: VERSION,
    mode: state.mode,
    folderPath: state.rootPath ?? null,
    tabs,
    activeTabIndex: state.activeTabIndex ?? 0,
  };

  storage.setItem(SESSION_PREFIX + windowLabel, JSON.stringify(session));

  const labels = loadLabels(storage);
  if (!labels.includes(windowLabel)) {
    labels.push(windowLabel);
    storage.setItem(SESSION_LABELS_KEY, JSON.stringify(labels));
  }
}

export function removeWindowSession(windowLabel, storage = localStorage) {
  storage.removeItem(SESSION_PREFIX + windowLabel);
  const labels = loadLabels(storage);
  const filtered = labels.filter((l) => l !== windowLabel);
  storage.setItem(SESSION_LABELS_KEY, JSON.stringify(filtered));
}

export function loadAllSessions(storage = localStorage) {
  const labels = loadLabels(storage);
  const sessions = [];

  for (const label of labels) {
    const raw = storage.getItem(SESSION_PREFIX + label);
    if (!raw) {
      continue;
    }
    try {
      const session = JSON.parse(raw);
      if (session && session.version === VERSION && Array.isArray(session.tabs) && session.tabs.length > 0) {
        sessions.push(session);
      }
    } catch {
      // skip corrupt entries
    }
  }

  return sessions;
}

export function pruneStaleWindows(liveLabels, storage = localStorage) {
  const savedLabels = loadLabels(storage);
  for (const label of savedLabels) {
    if (!liveLabels.includes(label)) {
      storage.removeItem(SESSION_PREFIX + label);
    }
  }
  const kept = savedLabels.filter((l) => liveLabels.includes(l));
  storage.setItem(SESSION_LABELS_KEY, JSON.stringify(kept));
}

export function clearAllSessions(storage = localStorage) {
  const labels = loadLabels(storage);
  for (const label of labels) {
    storage.removeItem(SESSION_PREFIX + label);
  }
  storage.removeItem(SESSION_LABELS_KEY);
  // clean up legacy single-window key
  storage.removeItem("teex-session");
}

function loadLabels(storage) {
  const raw = storage.getItem(SESSION_LABELS_KEY);
  if (!raw) {
    return [];
  }
  try {
    const labels = JSON.parse(raw);
    return Array.isArray(labels) ? labels : [];
  } catch {
    return [];
  }
}

function collectTabs(state) {
  const tabs = [];

  if (Array.isArray(state.openFiles) && state.openFiles.length > 0) {
    for (const tab of state.openFiles) {
      if (tab && typeof tab.path === "string" && tab.path) {
        tabs.push({
          path: tab.path,
          markdownViewMode: tab.markdownViewMode ?? "preview",
        });
      }
    }
  } else if (typeof state.activePath === "string" && state.activePath) {
    tabs.push({
      path: state.activePath,
      markdownViewMode: state.markdownViewMode ?? "preview",
    });
  }

  return tabs;
}
