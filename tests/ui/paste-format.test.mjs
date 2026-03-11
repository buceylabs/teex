import assert from "node:assert/strict";
import test from "node:test";

import {
  detectStructuredPasteKind,
  formatStructuredPasteText,
} from "../../src/ui/paste-format.js";

test("detects JSON by extension", () => {
  assert.equal(
    detectStructuredPasteKind({ activePath: "/tmp/data.JSON", text: "hello" }),
    "json",
  );
});

test("detects YAML by extension", () => {
  assert.equal(
    detectStructuredPasteKind({ activePath: "/tmp/config.yml", text: "hello" }),
    "yaml",
  );
});

test("detects JSON by content", () => {
  assert.equal(
    detectStructuredPasteKind({ activePath: null, text: '{"name":"teex"}' }),
    "json",
  );
});

test("detects YAML by content", () => {
  assert.equal(
    detectStructuredPasteKind({
      activePath: null,
      text: "root:\n  child: yes",
    }),
    "yaml",
  );
});

test("returns null for unstructured text", () => {
  assert.equal(
    detectStructuredPasteKind({ activePath: null, text: "hello world" }),
    null,
  );
});

test("formats structured text through backend command", async () => {
  let called = false;
  const result = await formatStructuredPasteText({
    invoke: async (cmd, payload) => {
      called = true;
      assert.equal(cmd, "format_structured_text");
      assert.deepEqual(payload, {
        content: '{"name":"teex"}',
        preferredKind: "json",
      });
      return {
        changed: true,
        formatted: '{\n  "name": "teex"\n}',
        detectedKind: "json",
      };
    },
    text: '{"name":"teex"}',
    activePath: null,
  });

  assert.equal(called, true);
  assert.deepEqual(result, {
    preferredKind: "json",
    detectedKind: "json",
    changed: true,
    formatted: '{\n  "name": "teex"\n}',
  });
});

test("returns null when backend says unchanged", async () => {
  const result = await formatStructuredPasteText({
    invoke: async () => ({
      changed: false,
      formatted: "root:\n  child: yes",
      detectedKind: "yaml",
    }),
    text: "root:\n  child: yes",
    activePath: "/tmp/config.yaml",
  });
  assert.deepEqual(result, {
    preferredKind: "yaml",
    detectedKind: "yaml",
    changed: false,
    formatted: null,
  });
});

test("returns null when detection fails and does not invoke backend", async () => {
  let called = false;
  const result = await formatStructuredPasteText({
    invoke: async () => {
      called = true;
      return { changed: false, formatted: "", detectedKind: null };
    },
    text: "plain text",
    activePath: "/tmp/notes.txt",
  });
  assert.equal(result, null);
  assert.equal(called, false);
});

test("applies heuristic YAML indentation when strict parse fails first", async () => {
  let call = 0;
  const malformed =
    "services:\nopenclaw-gateway:\nimage: ghcr.io/phioranex/openclaw-docker:latest";
  const result = await formatStructuredPasteText({
    invoke: async () => {
      call += 1;
      return { changed: false, formatted: malformed, detectedKind: null };
    },
    text: malformed,
    activePath: "/tmp/docker-compose.yml",
  });

  assert.equal(call, 1);
  assert.deepEqual(result, {
    preferredKind: "yaml",
    detectedKind: "yaml",
    changed: true,
    formatted:
      "services:\n  openclaw-gateway:\n    image: ghcr.io/phioranex/openclaw-docker:latest",
  });
});

test("heuristic indents lists under empty keys without rewriting inline arrays", async () => {
  const malformed = [
    "services:",
    "app:",
    'command: ["gateway"]',
    "environment:",
    "- NODE_ENV=production",
    "- DEBUG=false",
  ].join("\n");

  const result = await formatStructuredPasteText({
    invoke: async () => ({
      changed: false,
      formatted: malformed,
      detectedKind: null,
    }),
    text: malformed,
    activePath: "/tmp/docker-compose.yml",
  });

  assert.deepEqual(result, {
    preferredKind: "yaml",
    detectedKind: "yaml",
    changed: true,
    formatted: [
      "services:",
      "  app:",
      '    command: ["gateway"]',
      "    environment:",
      "      - NODE_ENV=production",
      "      - DEBUG=false",
    ].join("\n"),
  });
});
