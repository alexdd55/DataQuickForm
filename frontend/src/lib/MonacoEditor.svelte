<script lang="ts">
  import { onMount } from "svelte";
  import type * as Monaco from "monaco-editor";
  
  let monaco: any;

  export let value: string = "";
  export let language: "json" | "xml" | "plaintext" = "json";
  export let onChange: (v: string) => void = () => {};

  let el: HTMLDivElement;
  let editor: Monaco.editor.IStandaloneCodeEditor | null = null;

  onMount(async () => {
    monaco = await import("monaco-editor");
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

  // Wenn Tab/Lang gewechselt wird
  $: if (editor) {
    const model = editor.getModel();
    if (model && model.getValue() !== value) editor.setValue(value);
    if (model) monaco.editor.setModelLanguage(model, language);
  }
</script>

<div bind:this={el} style="height: 100%; width: 100%;" />
