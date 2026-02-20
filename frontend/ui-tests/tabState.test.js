import test from "node:test";
import assert from "node:assert/strict";

import { getActionEditorTab, getActiveEditorTab, getActiveTab, getSourceEditorTabForDiff } from "../.tmp-tests/tabState.js";

const editorA = {
  id: "editor-a",
  kind: "editor",
  title: "A.json",
  lang: "json",
  value: "{}",
  dirty: false,
  undoHistory: [],
  redoHistory: []
};

const editorB = {
  id: "editor-b",
  kind: "editor",
  title: "B.xml",
  lang: "xml",
  value: "<a/>",
  dirty: false,
  undoHistory: [],
  redoHistory: []
};

test("getActiveTab returns first tab when active id does not exist", () => {
  const tabs = [editorA, editorB];
  assert.equal(getActiveTab(tabs, "unknown").id, "editor-a");
});

test("getActiveEditorTab returns null on diff tabs", () => {
  const diff = {
    id: "diff-1",
    kind: "diff",
    sourceEditorId: "editor-a",
    title: "Diff",
    lang: "json",
    originalValue: "{}",
    value: '{"x":1}'
  };

  const tabs = [editorA, diff];
  assert.equal(getActiveEditorTab(tabs, "diff-1"), null);
});

test("getSourceEditorTabForDiff returns the editor linked from the diff tab", () => {
  const diff = {
    id: "diff-1",
    kind: "diff",
    sourceEditorId: "editor-b",
    title: "Diff",
    lang: "xml",
    originalValue: "<a/>",
    value: "<a>1</a>"
  };

  const tabs = [editorA, editorB, diff];
  const source = getSourceEditorTabForDiff(tabs, "diff-1");

  assert.ok(source);
  assert.equal(source.id, "editor-b");
});


test("getActionEditorTab returns source editor when diff tab is active", () => {
  const diff = {
    id: "diff-2",
    kind: "diff",
    sourceEditorId: "editor-a",
    title: "Diff",
    lang: "json",
    originalValue: "{}",
    value: "{\"y\":2}"
  };

  const tabs = [editorA, editorB, diff];
  const source = getActionEditorTab(tabs, "diff-2");

  assert.ok(source);
  assert.equal(source.id, "editor-a");
});
