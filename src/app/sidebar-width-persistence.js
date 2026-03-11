const STORAGE_KEY = "teex-sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 180;

export function loadSidebarWidth(storage = localStorage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) {
    return DEFAULT_WIDTH;
  }
  const parsed = parseInt(raw, 10);
  return parsed >= MIN_WIDTH ? parsed : DEFAULT_WIDTH;
}

export function saveSidebarWidth(width, storage = localStorage) {
  if (typeof width === "number" && width >= MIN_WIDTH) {
    storage.setItem(STORAGE_KEY, String(width));
  }
}
