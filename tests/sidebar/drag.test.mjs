import assert from "node:assert/strict";
import test from "node:test";

import {
  findOpenFileContent,
  isOverTabBar,
  shouldStartSidebarDrag,
} from "../../src/sidebar/drag.js";

test("shouldStartSidebarDrag returns false below threshold", () => {
  assert.equal(shouldStartSidebarDrag(2, 2), false);
  assert.equal(shouldStartSidebarDrag(0, 0), false);
  assert.equal(shouldStartSidebarDrag(4, 0), false);
  assert.equal(shouldStartSidebarDrag(-3, 1), false);
});

test("shouldStartSidebarDrag returns true at threshold", () => {
  assert.equal(shouldStartSidebarDrag(5, 0), true);
  assert.equal(shouldStartSidebarDrag(0, 5), true);
  assert.equal(shouldStartSidebarDrag(3, 3), true);
  assert.equal(shouldStartSidebarDrag(-5, 0), true);
  assert.equal(shouldStartSidebarDrag(10, 10), true);
});

test("findOpenFileContent returns content for open file", () => {
  const openFiles = [
    { path: "/tmp/a.md", content: "alpha" },
    { path: "/tmp/b.txt", content: "bravo" },
  ];
  assert.equal(findOpenFileContent(openFiles, "/tmp/b.txt"), "bravo");
});

test("findOpenFileContent returns null for file not open", () => {
  const openFiles = [{ path: "/tmp/a.md", content: "alpha" }];
  assert.equal(findOpenFileContent(openFiles, "/tmp/c.txt"), null);
});

test("findOpenFileContent returns null for empty openFiles", () => {
  assert.equal(findOpenFileContent([], "/tmp/a.md"), null);
});

test("findOpenFileContent returns empty string content (not null)", () => {
  const openFiles = [{ path: "/tmp/empty.md", content: "" }];
  assert.equal(findOpenFileContent(openFiles, "/tmp/empty.md"), "");
});

test("isOverTabBar returns true when cursor is inside tab bar rect", () => {
  const tabBar = {
    getBoundingClientRect: () => ({ left: 0, right: 800, top: 0, bottom: 36 }),
    classList: { contains: () => false },
  };
  assert.equal(isOverTabBar(tabBar, 400, 18), true);
});

test("isOverTabBar returns false when cursor is below tab bar", () => {
  const tabBar = {
    getBoundingClientRect: () => ({ left: 0, right: 800, top: 0, bottom: 36 }),
    classList: { contains: () => false },
  };
  assert.equal(isOverTabBar(tabBar, 400, 50), false);
});

test("isOverTabBar returns false when tab bar is hidden", () => {
  const tabBar = {
    getBoundingClientRect: () => ({ left: 0, right: 800, top: 0, bottom: 36 }),
    classList: { contains: (c) => c === "hidden" },
  };
  assert.equal(isOverTabBar(tabBar, 400, 18), false);
});
