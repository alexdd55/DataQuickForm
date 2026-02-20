import test from "node:test";
import assert from "node:assert/strict";

import {
  compressJsonContent,
  compressXmlContent,
  detectPlatform,
  getBaseName,
  guessLang,
  guessLangFromFilename,
  makeId
} from "../.tmp-tests/appUtils.js";

function withMockNavigator(mockNavigator, run) {
  const original = globalThis.navigator;
  Object.defineProperty(globalThis, "navigator", {
    value: mockNavigator,
    configurable: true,
    writable: true
  });
  try {
    run();
  } finally {
    Object.defineProperty(globalThis, "navigator", {
      value: original,
      configurable: true,
      writable: true
    });
  }
}

test("detectPlatform resolves macos/windows/linux from navigator", () => {
  withMockNavigator({ platform: "MacIntel", userAgent: "Test" }, () => {
    assert.equal(detectPlatform(), "macos");
  });
  withMockNavigator({ platform: "Win32", userAgent: "Test" }, () => {
    assert.equal(detectPlatform(), "windows");
  });
  withMockNavigator({ platform: "X11", userAgent: "Linux" }, () => {
    assert.equal(detectPlatform(), "linux");
  });
});

test("makeId returns a non-empty string id", () => {
  const id = makeId();
  assert.equal(typeof id, "string");
  assert.ok(id.length > 0);
});

test("getBaseName extracts final path segment", () => {
  assert.equal(getBaseName("/a/b/c.json"), "c.json");
  assert.equal(getBaseName("C:\\a\\b\\c.xml"), "c.xml");
});

test("guessLang and guessLangFromFilename infer json/xml/plaintext", () => {
  assert.equal(guessLang("json"), "json");
  assert.equal(guessLang("xml"), "xml");
  assert.equal(guessLang("other"), "plaintext");

  assert.equal(guessLangFromFilename("file.json"), "json");
  assert.equal(guessLangFromFilename("file.XML"), "xml");
  assert.equal(guessLangFromFilename("file.txt"), "plaintext");
});

test("compress helpers reduce whitespace correctly", () => {
  assert.equal(compressJsonContent("{\n  \"a\": 1\n}"), "{\"a\":1}");
  assert.equal(compressXmlContent("<a>\n  <b>1</b>\n</a>"), "<a><b>1</b></a>");
});
