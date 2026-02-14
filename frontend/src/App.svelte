<script lang="ts">
  import { onMount } from "svelte";
  import MonacoEditor from "./lib/MonacoEditor.svelte";
  import { OnFileDrop } from "../wailsjs/runtime/runtime";
  import { FormatContent, OpenFile, ValidateContent } from "../wailsjs/go/main/App";

  type Tab = {
    id: string;
    title: string;
    path?: string;
    lang: "json" | "xml" | "plaintext";
    value: string;
  };

  type Status = {
    kind: "ok" | "error" | "info";
    message: string;
  };

  type ErrorPosition = {
    line: number;
    column: number;
  } | null;

  function makeId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  let tabs: Tab[] = [
    { id: makeId(), title: "Untitled.json", lang: "json", value: "{\n  \n}\n" }
  ];
  let activeId = tabs[0].id;
  let status: Status = { kind: "info", message: "Bereit." };
  let isProcessing = false;
  let errorPosition: ErrorPosition = null;

  const active = () => tabs.find(t => t.id === activeId) ?? tabs[0];

  function setActiveValue(v: string) {
    tabs = tabs.map(t => t.id === activeId ? { ...t, value: v } : t);
  }

  function guessLang(type: string): Tab["lang"] {
    if (type === "json") return "json";
    if (type === "xml") return "xml";
    return "plaintext";
  }

  function supportsActions() {
    return active().lang === "json" || active().lang === "xml";
  }

  async function openPath(path: string) {
    const res = await OpenFile(path);
    const id = makeId();
    tabs = [
      ...tabs,
      { id, title: res.filename, path: res.path, lang: guessLang(res.type), value: res.content }
    ];
    activeId = id;
    status = { kind: "info", message: `${res.filename} geladen.` };
    errorPosition = null;
  }

  async function runValidate() {
    if (!supportsActions() || isProcessing) {
      return;
    }

    isProcessing = true;
    try {
      const tab = active();
      const res = await ValidateContent(tab.value, tab.lang);
      status = { kind: res.ok ? "ok" : "error", message: res.message };
      errorPosition = !res.ok && res.line ? { line: res.line, column: Math.max(1, res.column || 1) } : null;
    } finally {
      isProcessing = false;
    }
  }

  async function runFormat() {
    if (!supportsActions() || isProcessing) {
      return;
    }

    isProcessing = true;
    try {
      const tab = active();
      const res = await FormatContent(tab.value, tab.lang);
      status = { kind: res.ok ? "ok" : "error", message: res.message };

      if (res.ok && res.output !== undefined) {
        setActiveValue(res.output);
        errorPosition = null;
      } else {
        errorPosition = res.line ? { line: res.line, column: Math.max(1, res.column || 1) } : null;
      }
    } finally {
      isProcessing = false;
    }
  }

  onMount(async () => {
    // Wait a moment for Wails runtime to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      OnFileDrop((x: any) => {
        const files = x.detail.files || [];
        // ... handle files ...
      });
    } catch (error) {
      console.error("Failed to initialize drag & drop:", error);
    }
  });

  $: if (activeId) {
    errorPosition = null;
  }
</script>

<style>
  .root { height: 100vh; display: flex; flex-direction: column; }
  .toolbar { padding: 8px; display: flex; gap: 8px; align-items: center; }
  .tabs { display: flex; gap: 6px; padding: 0 8px 8px 8px; flex-wrap: wrap; }
  .tab { padding: 6px 10px; border-radius: 8px; border: 1px solid #ccc; background: white; cursor: pointer; }
  .tab.active { border: 2px solid #888; }
  .editor { flex: 1; }
  .hint { margin-left: auto; opacity: 0.7; }
  .status {
    padding: 8px;
    margin: 0 8px 8px 8px;
    border-radius: 8px;
    border: 1px solid transparent;
    font-size: 0.9rem;
  }
  .status.info { background: #f2f3f5; border-color: #e0e2e7; }
  .status.ok { background: #edf9f0; border-color: #b6e3c1; }
  .status.error { background: #fdecec; border-color: #f3b6b6; }
  button:disabled { opacity: 0.6; cursor: not-allowed; }
</style>

<div class="root">
  <div class="toolbar">
    <button on:click={runFormat} disabled={!supportsActions() || isProcessing}>Format</button>
    <button on:click={runValidate} disabled={!supportsActions() || isProcessing}>Validate</button>
    <div class="hint">Drag & Drop: *.json / *.xml</div>
  </div>

  <div class="tabs">
    {#each tabs as t (t.id)}
      <button
        class="tab {t.id === activeId ? 'active' : ''}"
        on:click={() => (activeId = t.id)}
        title={t.path ?? ""}
      >
        {t.title}
      </button>
    {/each}
  </div>

  <div class="status {status.kind}">{status.message}</div>

  <div class="editor">
    <MonacoEditor
      value={active().value}
      language={active().lang}
      errorPosition={errorPosition}
      onChange={setActiveValue}
    />
  </div>
</div>
