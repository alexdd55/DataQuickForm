import test from "node:test";
import assert from "node:assert/strict";

import { getToolbarDisabledState } from "../.tmp-tests/toolbarState.js";

const editorJson = {
  id: "editor-json",
  kind: "editor",
  title: "A.json",
  lang: "json",
  value: "{\n  \"a\": 1\n}",
  dirty: false,
  undoHistory: [],
  redoHistory: []
};

const editorWithHistory = {
  ...editorJson,
  undoHistory: ["{}"],
  redoHistory: ["{\n  \"a\": 2\n}"]
};

const editorPlaintext = {
  id: "editor-txt",
  kind: "editor",
  title: "A.txt",
  lang: "plaintext",
  value: "hello",
  dirty: false,
  undoHistory: [],
  redoHistory: []
};

test("all toolbar buttons are disabled when no action editor is available", () => {
  const orphanDiff = {
    id: "diff-orphan",
    kind: "diff",
    sourceEditorId: "missing-editor",
    title: "Diff",
    lang: "json",
    originalValue: "{}",
    value: "{\"x\":1}"
  };
  const disabled = getToolbarDisabledState({
    tabs: [editorJson, orphanDiff],
    activeId: "diff-orphan",
    isProcessing: false,
    outputValue: ""
  });

  assert.deepEqual(disabled, {
    format: true,
    validate: true,
    undo: true,
    redo: true,
    clear: true,
    compress: true,
    outputToEditor: true,
    copyOutput: true,
    compareClipboard: true
  });
});

test("all toolbar buttons can be enabled when action editor and output are available", () => {
  const diff = {
    id: "diff-json",
    kind: "diff",
    sourceEditorId: "editor-json",
    title: "Diff",
    lang: "json",
    originalValue: "{}",
    value: "{\"x\":1}"
  };
  const disabled = getToolbarDisabledState({
    tabs: [editorWithHistory, diff],
    activeId: "diff-json",
    isProcessing: false,
    outputValue: "{\n  \"result\": true\n}"
  });

  assert.deepEqual(disabled, {
    format: false,
    validate: false,
    undo: false,
    redo: false,
    clear: false,
    compress: false,
    outputToEditor: false,
    copyOutput: false,
    compareClipboard: false
  });
});

test("processing only disables processing-sensitive buttons", () => {
  const disabled = getToolbarDisabledState({
    tabs: [editorWithHistory],
    activeId: "editor-json",
    isProcessing: true,
    outputValue: "has output"
  });

  assert.deepEqual(disabled, {
    format: true,
    validate: true,
    undo: true,
    redo: true,
    clear: true,
    compress: true,
    outputToEditor: false,
    copyOutput: false,
    compareClipboard: true
  });
});

test("format and validate stay disabled for plaintext while other eligible actions remain enabled", () => {
  const plaintextWithHistory = {
    ...editorPlaintext,
    undoHistory: ["old text"],
    redoHistory: ["future text"]
  };
  const disabled = getToolbarDisabledState({
    tabs: [plaintextWithHistory],
    activeId: "editor-txt",
    isProcessing: false,
    outputValue: "trim me"
  });

  assert.equal(disabled.format, true);
  assert.equal(disabled.validate, true);
  assert.equal(disabled.undo, false);
  assert.equal(disabled.redo, false);
  assert.equal(disabled.clear, false);
  assert.equal(disabled.compress, false);
  assert.equal(disabled.outputToEditor, false);
  assert.equal(disabled.copyOutput, false);
  assert.equal(disabled.compareClipboard, false);
});

test("output-dependent buttons disable when output is empty", () => {
  const disabled = getToolbarDisabledState({
    tabs: [editorWithHistory],
    activeId: "editor-json",
    isProcessing: false,
    outputValue: ""
  });

  assert.equal(disabled.compress, true);
  assert.equal(disabled.outputToEditor, true);
  assert.equal(disabled.copyOutput, true);
  assert.equal(disabled.compareClipboard, false);
});
