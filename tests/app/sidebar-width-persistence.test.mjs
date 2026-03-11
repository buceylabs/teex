import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  loadSidebarWidth,
  saveSidebarWidth,
} from "../../src/app/sidebar-width-persistence.js";

function createMockStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}

describe("loadSidebarWidth", () => {
  it("returns default when nothing stored", () => {
    const storage = createMockStorage();
    assert.equal(loadSidebarWidth(storage), 280);
  });

  it("returns saved width", () => {
    const storage = createMockStorage();
    storage.setItem("teex-sidebar-width", "350");
    assert.equal(loadSidebarWidth(storage), 350);
  });

  it("returns default for values below minimum", () => {
    const storage = createMockStorage();
    storage.setItem("teex-sidebar-width", "100");
    assert.equal(loadSidebarWidth(storage), 280);
  });

  it("returns default for non-numeric values", () => {
    const storage = createMockStorage();
    storage.setItem("teex-sidebar-width", "abc");
    assert.equal(loadSidebarWidth(storage), 280);
  });
});

describe("saveSidebarWidth", () => {
  it("stores width in storage", () => {
    const storage = createMockStorage();
    saveSidebarWidth(350, storage);
    assert.equal(storage.getItem("teex-sidebar-width"), "350");
  });

  it("ignores values below minimum", () => {
    const storage = createMockStorage();
    saveSidebarWidth(100, storage);
    assert.equal(storage.getItem("teex-sidebar-width"), null);
  });

  it("ignores non-number values", () => {
    const storage = createMockStorage();
    saveSidebarWidth("abc", storage);
    assert.equal(storage.getItem("teex-sidebar-width"), null);
  });

  it("round-trips with loadSidebarWidth", () => {
    const storage = createMockStorage();
    saveSidebarWidth(420, storage);
    assert.equal(loadSidebarWidth(storage), 420);
  });
});
