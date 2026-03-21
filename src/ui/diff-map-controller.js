import { buildDiffTicks, tickTop } from "./diff-map-math.js";

const TICK_HEIGHT = 3;

export function createDiffMapController({ el, codeEditorController }) {
  let currentAnnotations = [];
  let currentTotalLines = 0;
  let rafId = null;

  const container = document.createElement("div");
  container.classList.add("diff-map", "hidden");
  el.editorState.appendChild(container);

  container.addEventListener("click", (e) => {
    const line = e.target.getAttribute("data-line");
    if (line) {
      codeEditorController.scrollToLine(parseInt(line, 10));
    }
  });

  const observer = new ResizeObserver(() => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      render();
    });
  });

  function getScroller() {
    return el.codeEditor.querySelector(".cm-scroller");
  }

  function render() {
    container.textContent = "";

    const scroller = getScroller();
    if (!scroller) return;

    const trackHeight = scroller.clientHeight;
    if (trackHeight <= 0) return;

    const ticks = buildDiffTicks(currentAnnotations, currentTotalLines);

    for (const tick of ticks) {
      const tickEl = document.createElement("div");
      tickEl.classList.add("diff-map-tick", `diff-map-tick--${tick.diffType}`);
      const h = Math.max(TICK_HEIGHT, tick.height * 2);
      tickEl.style.top = `${tickTop(tick.fraction, trackHeight, h)}px`;
      tickEl.style.height = `${h}px`;
      tickEl.setAttribute("data-line", String(tick.line));
      container.appendChild(tickEl);
    }
  }

  function update(annotations, totalLines) {
    currentAnnotations = annotations;
    currentTotalLines = totalLines;
    container.classList.remove("hidden");
    render();
    const scroller = getScroller();
    if (scroller) {
      observer.disconnect();
      observer.observe(scroller);
    }
  }

  function hide() {
    container.classList.add("hidden");
    container.textContent = "";
    observer.disconnect();
  }

  function destroy() {
    hide();
    if (rafId) cancelAnimationFrame(rafId);
    el.editorState.removeChild(container);
  }

  return { update, hide, destroy };
}
