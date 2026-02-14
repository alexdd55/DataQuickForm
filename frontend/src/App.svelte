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
  let outputValue = "";
  let processingToken = 0;
  let activeTab: Tab;
  let activeContent = "";

  const active = () => tabs.find((t) => t.id === activeId) ?? tabs[0];

  function setActiveValue(v: string) {
    tabs = tabs.map((t) => (t.id === activeId ? { ...t, value: v } : t));
  }

  function setActiveTab(tab: Partial<Tab>) {
    tabs = tabs.map((t) => (t.id === activeId ? { ...t, ...tab } : t));
  }

  function guessLang(type: string): Tab["lang"] {
    if (type === "json") return "json";
    if (type === "xml") return "xml";
    return "plaintext";
  }

  function guessLangFromFilename(filename: string): Tab["lang"] {
    const lower = filename.toLowerCase();
    if (lower.endsWith(".json")) return "json";
    if (lower.endsWith(".xml")) return "xml";
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

  async function processContent() {
    const tab = active();
    const currentToken = ++processingToken;

    if (!(tab.lang === "json" || tab.lang === "xml")) {
      outputValue = tab.value;
      status = { kind: "info", message: "Validierung/Formatierung nur für JSON/XML verfügbar." };
      errorPosition = null;
      return;
    }

    isProcessing = true;
    try {
      const validation = await ValidateContent(tab.value, tab.lang);
      if (currentToken !== processingToken) return;

      if (!validation.ok) {
        status = { kind: "error", message: validation.message };
        outputValue = "";
        errorPosition = validation.line
          ? { line: validation.line, column: Math.max(1, validation.column || 1) }
          : null;
        return;
      }

      const formatting = await FormatContent(tab.value, tab.lang);
      if (currentToken !== processingToken) return;

      status = { kind: formatting.ok ? "ok" : "error", message: formatting.message };
      if (formatting.ok && formatting.output !== undefined) {
        outputValue = formatting.output;
        errorPosition = null;
      } else {
        outputValue = "";
        errorPosition = formatting.line
          ? { line: formatting.line, column: Math.max(1, formatting.column || 1) }
          : null;
      }
    } finally {
      if (currentToken === processingToken) {
        isProcessing = false;
      }
    }
  }

  async function runValidate() {
    await processContent();
  }

  async function runFormat() {
    await processContent();
    if (outputValue && supportsActions()) {
      setActiveValue(outputValue);
    }
  }

  function copyOutputToEditor() {
    if (!outputValue) {
      return;
    }

    setActiveValue(outputValue);
  }

  async function handleLocalFileDrop(event: DragEvent) {
    event.preventDefault();
    const droppedFiles = event.dataTransfer?.files;
    if (!droppedFiles || droppedFiles.length === 0) {
      return;
    }

    const file = droppedFiles[0];
    const lang = guessLangFromFilename(file.name);

    if (!(lang === "json" || lang === "xml")) {
      status = { kind: "error", message: "Bitte nur JSON- oder XML-Dateien ablegen." };
      return;
    }

    const content = await file.text();
    setActiveTab({ title: file.name, path: undefined, lang, value: content });
    status = { kind: "info", message: `${file.name} geladen.` };
  }

  onMount(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      OnFileDrop((_x: number, _y: number, files: string[]) => {
        const validFiles = files.filter(
          (f: string) => f.toLowerCase().endsWith(".json") || f.toLowerCase().endsWith(".xml")
        );
        if (validFiles.length > 0) {
          openPath(validFiles[0]);
        }
      }, false);
    } catch (error) {
      console.error("Failed to initialize drag & drop:", error);
    }
  });

  $: activeTab = active();
  $: activeContent = activeTab?.value;
  $: if (activeContent !== undefined) {
    processContent();
  }
</script>

<style>
  .root { height: 100vh; display: flex; flex-direction: column; }
  .toolbar { padding: 8px; display: flex; gap: 8px; align-items: center; }
  .tabs { display: flex; gap: 6px; padding: 0 8px 8px 8px; flex-wrap: wrap; }
  .tab { padding: 6px 10px; border-radius: 8px; border: 1px solid #ccc; background: white; cursor: pointer; }
  .tab.active { border: 2px solid #888; }
  .sidebyside { display: flex; gap: 8px; flex: 1; padding: 0 8px 8px 8px; }
  .editor { text-align: left; flex: 1; border: 1px dashed transparent; border-radius: 6px; }
  .output { text-align: left; flex: 1; }
  .hint { margin-left: auto; opacity: 0.7; }
  .status {
    padding: 8px;
    margin: 0 8px 8px 8px;
    border-radius: 8px;
    border: 1px solid transparent;
    font-size: 0.9rem;
  }
  .status.info { color: #e0e2e7; }
  .status.ok { color: #b6e3c1; }
  .status.error { color: #f3b6b6; }
  button:disabled { opacity: 0.6; cursor: not-allowed; }
</style>

<div class="root">
  <div class="toolbar">
    <button on:click={runFormat} disabled={!supportsActions() || isProcessing}>Format & Anwenden</button>
    <button on:click={runValidate} disabled={!supportsActions() || isProcessing}>Validate</button>
    <button on:click={copyOutputToEditor} disabled={!outputValue}>Output → Editor</button>
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

  <div class="sidebyside">
    <div
      class="editor"
      role="region"
      aria-label="Editor mit Drag-and-Drop für JSON/XML"
      on:dragover|preventDefault
      on:drop={handleLocalFileDrop}
    >
      <MonacoEditor
        value={active().value}
        language={active().lang}
        errorPosition={errorPosition}
        onChange={setActiveValue}
      />
    </div>
    <div class="output">
      <MonacoEditor
        value={outputValue}
        language={active().lang}
        readonly={true}
      />
    </div>
  </div>
  <div class="footer">
    <div class="status {status.kind}">{status.message}</div>
  </div>
</div>
