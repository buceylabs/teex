import { bindStartupElements, renderStartupView } from "./app/startup-view.js";

const { invoke } = window.__TAURI__.core;

function afterNextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

async function start() {
  let startupPayload = null;
  try {
    startupPayload = await invoke("take_startup_payload");
  } catch (error) {
    console.error(String(error));
  }

  renderStartupView(startupPayload, bindStartupElements());
  await afterNextPaint();

  try {
    const { startApplication } = await import("./app/application.js");
    await startApplication({ startupPayload });
  } catch (error) {
    console.error(String(error));
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
