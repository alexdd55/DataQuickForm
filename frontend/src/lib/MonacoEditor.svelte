<script lang="ts">
  import { onMount } from "svelte";
  import type * as Monaco from "monaco-editor";

  let monaco: typeof Monaco;

  export let value: string = "";
  export let language: "json" | "xml" | "plaintext" = "json";
  export let errorPosition: { line: number; column: number } | null = null;
  export let onChange: (v: string) => void = () => {};

  let el: HTMLDivElement;
  let editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  let errorDecorations: string[] = [];

  onMount(async () => {
    const monacoModule = await import("monaco-editor");
    monaco = monacoModule.default || monacoModule;
    
    // Configure worker paths
    const monacoWorkers = await import('monaco-editor/esm/vs/editor/editor.worker?worker');
    window.MonacoEnvironment = {
      getWorker: () => new monacoWorkers.default()
    };

    editor = monaco.editor.create(el, {
      value,
      language,
      automaticLayout: true,
      minimap: { enabled: false },
      wordWrap: "on",
      fontSize: 14,
    });

    const sub = editor.onDidChangeModelContent(() => {
      onChange(editor!.getValue());
    });

    return () => {
      sub.dispose();
      editor?.dispose();
    };
  });

  $: if (editor) {
    const model = editor.getModel();
    if (model && model.getValue() !== value) editor.setValue(value);
    if (model) monaco.editor.setModelLanguage(model, language);
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

<div bind:this={el} style="height: 100%; width: 100%;" />
