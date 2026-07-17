import { escapeAttr, escapeHtml } from "../ui/html-utils.js";
import { baseName } from "../utils/app-utils.js";

export function waitForStartupPaint({
  scheduleFrame = requestAnimationFrame,
  scheduleTask = (callback) => setTimeout(callback, 0),
} = {}) {
  return new Promise((resolve) => {
    scheduleFrame(() => scheduleTask(resolve));
  });
}

export function startupViewFromPayload(startupPayload) {
  const context = startupPayload?.context;
  const file = startupPayload?.file;

  if (file?.path && typeof file.content === "string") {
    return {
      hasDocument: true,
      title: baseName(file.path),
      path: file.path,
      content: file.content,
    };
  }

  if (!context || context.mode === "empty") {
    return {
      hasDocument: true,
      title: "Untitled",
      path: null,
      content: "",
    };
  }

  return {
    hasDocument: false,
    title: "Teex",
    path: null,
    content: "",
  };
}

export function buildStartupTabHtml({ title, path }) {
  const tooltip = path || title;
  return `<div class="tab tab-active" data-index="0"><button class="tab-close" data-index="0" title="Close" aria-label="Close ${escapeAttr(title)}">×</button><span class="tab-label" title="${escapeAttr(tooltip)}">${escapeHtml(title)}</span><span class="tab-shortcut" aria-hidden="true">⌘1</span></div>`;
}

export function bindStartupElements(root = document) {
  return {
    tabBarRow: root.querySelector(".tab-bar-row"),
    tabBar: root.querySelector("#tab-bar"),
    editor: root.querySelector("#editor"),
    codeEditor: root.querySelector("#code-editor"),
    preview: root.querySelector("#preview"),
    unifiedDiff: root.querySelector("#unified-diff"),
  };
}

export function renderStartupView(startupPayload, el) {
  const view = startupViewFromPayload(startupPayload);
  document.title = view.title;
  document.documentElement.dataset.startupPhase = "document-visible";

  el.tabBarRow?.classList.toggle("hidden", !view.hasDocument);
  if (el.tabBar) {
    el.tabBar.innerHTML = view.hasDocument ? buildStartupTabHtml(view) : "";
  }

  el.codeEditor?.classList.add("hidden");
  el.preview?.classList.add("hidden");
  el.unifiedDiff?.classList.add("hidden");

  if (!el.editor) {
    return view;
  }

  el.editor.value = view.content;
  el.editor.classList.toggle("hidden", !view.hasDocument);
  if (view.hasDocument) {
    el.editor.focus();
  }

  return view;
}
