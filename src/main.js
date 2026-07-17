import {
  bindStartupElements,
  renderStartupView,
  waitForStartupPaint,
} from "./app/startup-view.js";

const { invoke } = window.__TAURI__.core;
performance.mark("teex:startup-entry");

async function start() {
  let startupPayload = null;
  try {
    startupPayload = await invoke("take_startup_payload");
    performance.mark("teex:startup-payload-ready");
  } catch (error) {
    console.error(String(error));
  }

  renderStartupView(startupPayload, bindStartupElements());
  performance.mark("teex:startup-shell-ready");
  await waitForStartupPaint();
  performance.mark("teex:document-visible");

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
