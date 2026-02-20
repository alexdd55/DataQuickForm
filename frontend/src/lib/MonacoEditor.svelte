<script lang="ts">
  import { onMount } from "svelte";
  import type * as Monaco from "monaco-editor";

  let monaco: typeof Monaco;

  export let value: string = "";
  export let originalValue: string = "";
  export let language: "json" | "xml" | "plaintext" = "json";
  export let errorPosition: { line: number; column: number } | null = null;
  export let onChange: (v: string) => void = () => {};
  export let onDropFile: ((event: DragEvent) => void) | null = null;
  export let readonly = false;
  export let originalEditable = false;
  export let mode: "code" | "diff" = "code";

  let el: HTMLDivElement;
  let editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  let diffEditor: Monaco.editor.IStandaloneDiffEditor | null = null;
  let diffOriginalModel: Monaco.editor.ITextModel | null = null;
  let diffModifiedModel: Monaco.editor.ITextModel | null = null;
  let errorDecorations: string[] = [];
  let isApplyingExternalUpdate = false;

  function withExternalUpdateGuard(run: () => void) {
    isApplyingExternalUpdate = true;
    try {
      run();
    } finally {
      isApplyingExternalUpdate = false;
    }
  }

  onMount(() => {
    let sub: Monaco.IDisposable | null = null;
    let diffSub: Monaco.IDisposable | null = null;
    let destroyed = false;

    const handleDrop = (event: DragEvent) => {
      if (!onDropFile) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onDropFile(event);
    };

    const handleDragOver = (event: DragEvent) => {
      if (!onDropFile) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    const initEditor = async () => {
      try {
        const monacoModule = await import("monaco-editor");
        if (destroyed) {
          return;
        }
        monaco = monacoModule.default || monacoModule;

        // Configure worker paths per language service.
        const editorWorker = await import("monaco-editor/esm/vs/editor/editor.worker?worker");
        const jsonWorker = await import("monaco-editor/esm/vs/language/json/json.worker?worker");
        if (destroyed) {
          return;
        }
        window.MonacoEnvironment = {
          getWorker: (_moduleId: string, label: string) => {
            if (label === "json") {
              return new jsonWorker.default();
            }

            return new editorWorker.default();
          }
        };

        if (mode === "diff") {
          diffEditor = monaco.editor.createDiffEditor(el, {
            automaticLayout: true,
            minimap: { enabled: false },
            wordWrap: "off",
            fontSize: 14,
            readOnly: readonly,
            originalEditable,
            renderSideBySide: true
          });

          diffOriginalModel = monaco.editor.createModel(originalValue, language);
          diffModifiedModel = monaco.editor.createModel(value, language);
          diffEditor.setModel({ original: diffOriginalModel, modified: diffModifiedModel });

          diffSub = diffEditor.getModifiedEditor().onDidChangeModelContent(() => {
            if (isApplyingExternalUpdate) {
              return;
            }
            const nextValue = diffEditor!.getModifiedEditor().getValue();
            if (nextValue !== value) {
              onChange(nextValue);
            }
          });
        } else {
          editor = monaco.editor.create(el, {
            value,
            language,
            automaticLayout: true,
            minimap: { enabled: false },
            wordWrap: "on",
            fontSize: 14,
            readOnly: readonly
          });

          sub = editor.onDidChangeModelContent(() => {
            if (isApplyingExternalUpdate) {
              return;
            }
            const nextValue = editor!.getValue();
            if (nextValue !== value) {
              onChange(nextValue);
            }
          });
        }

        if (destroyed) {
          editor?.dispose();
          diffEditor?.dispose();
          diffOriginalModel?.dispose();
          diffModifiedModel?.dispose();
          return;
        }

        el.addEventListener("dragover", handleDragOver, true);
        el.addEventListener("drop", handleDrop, true);
      } catch (error) {
        console.error("Failed to initialize Monaco editor:", error);
      }
    };

    void initEditor();

    return () => {
      destroyed = true;
      sub?.dispose();
      diffSub?.dispose();
      diffOriginalModel?.dispose();
      diffModifiedModel?.dispose();
      el.removeEventListener("dragover", handleDragOver, true);
      el.removeEventListener("drop", handleDrop, true);
      editor?.dispose();
      diffEditor?.dispose();
    };
  });

  $: if (editor) {
    const model = editor.getModel();
    if (model && model.getValue() !== value) {
      withExternalUpdateGuard(() => {
        editor.setValue(value);
      });
    }
    if (model) monaco.editor.setModelLanguage(model, language);
    editor.updateOptions({ readOnly: readonly });
  }

  $: if (diffEditor && diffOriginalModel && diffModifiedModel) {
    if (diffOriginalModel.getValue() !== originalValue) {
      withExternalUpdateGuard(() => {
        diffOriginalModel.setValue(originalValue);
      });
    }
    if (diffModifiedModel.getValue() !== value) {
      withExternalUpdateGuard(() => {
        diffModifiedModel.setValue(value);
      });
    }

    monaco.editor.setModelLanguage(diffOriginalModel, language);
    monaco.editor.setModelLanguage(diffModifiedModel, language);
    diffEditor.updateOptions({ readOnly: readonly, originalEditable, wordWrap: "off" });
  }

  $: if (editor && monaco) {
    const model = editor.getModel();

    if (model && errorPosition) {
      const line = Math.max(1, errorPosition.line);
      const column = Math.max(1, errorPosition.column);

      errorDecorations = editor.deltaDecorations(errorDecorations, [
        {
          range: new monaco.Range(line, column, line, column + 1),
          options: {
            className: "editor-error-marker",
            glyphMarginClassName: "editor-error-glyph",
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        },
      ]);

      editor.revealPositionInCenter({ lineNumber: line, column });
      editor.setPosition({ lineNumber: line, column });
    } else {
      errorDecorations = editor.deltaDecorations(errorDecorations, []);
    }
  }
</script>

<style>
  :global(.editor-error-marker) {
    background-color: rgba(220, 38, 38, 0.25);
  }

  :global(.editor-error-glyph) {
    background: #dc2626;
    width: 8px !important;
    border-radius: 9999px;
    margin-left: 4px;
    height: 8px;
    margin-top: 6px;
  }
</style>

<div bind:this={el} style="height: 100%; width: 100%;"></div>
