<script lang="ts">
  import { onMount } from "svelte";
  import MonacoEditor from "./lib/MonacoEditor.svelte";
  import { EventsOn, OnFileDrop } from "../wailsjs/runtime/runtime";
  import {
    FormatContent,
    OpenFile,
    OpenFileDialogAndRead,
    SaveFile,
    SaveFileAs,
    ShowAboutDialog,
    ShowPreferencesDialog,
    ValidateContent
  } from "../wailsjs/go/main/App";

  type Tab = {
    id: string;
    title: string;
    path?: string;
    lang: "json" | "xml" | "plaintext";
    value: string;
    dirty: boolean;
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

  function createUntitledTab(): Tab {
    return { id: makeId(), title: "Untitled.json", lang: "json", value: "{\n  \n}\n", dirty: false };
  }

  let tabs: Tab[] = [createUntitledTab()];
  let activeId = tabs[0].id;
  let status: Status = { kind: "info", message: "Bereit." };
  let isProcessing = false;
  let errorPosition: ErrorPosition = null;
  let outputValue = "";
  let processingToken = 0;

  const active = () => tabs.find((t) => t.id === activeId) ?? tabs[0];

  function setActiveValue(v: string) {
    const index = tabs.findIndex((t) => t.id === activeId);
    if (index === -1) {
      return;
    }

    const current = tabs[index];
    if (current.value === v) {
      return;
    }

    tabs = [
      ...tabs.slice(0, index),
      { ...current, value: v, dirty: true },
      ...tabs.slice(index + 1)
    ];
  }

  function setActiveTab(tab: Partial<Tab>) {
    const index = tabs.findIndex((t) => t.id === activeId);
    if (index === -1) {
      return;
    }

    tabs = [
      ...tabs.slice(0, index),
      { ...tabs[index], ...tab },
      ...tabs.slice(index + 1)
    ];
  }

  function closeTab(tabId: string) {
    const index = tabs.findIndex((t) => t.id === tabId);
    if (index === -1) {
      return;
    }

    const closedTab = tabs[index];
    const nextTabs = [...tabs.slice(0, index), ...tabs.slice(index + 1)];
    tabs = nextTabs.length > 0 ? nextTabs : [createUntitledTab()];

    if (tabId === activeId) {
      const fallbackIndex = Math.max(0, index - 1);
      activeId = tabs[Math.min(fallbackIndex, tabs.length - 1)].id;
      outputValue = "";
      errorPosition = null;
    }

    processingToken += 1;
    isProcessing = false;
    status = { kind: "info", message: `${closedTab.title} geschlossen.` };
  }

  function createTabRightOfActive() {
    const newTab = createUntitledTab();
    const activeIndex = tabs.findIndex((t) => t.id === activeId);
    const insertIndex = activeIndex === -1 ? tabs.length : activeIndex + 1;

    tabs = [
      ...tabs.slice(0, insertIndex),
      newTab,
      ...tabs.slice(insertIndex)
    ];

    activeId = newTab.id;
    outputValue = "";
    errorPosition = null;
    processingToken += 1;
    isProcessing = false;
    status = { kind: "info", message: "Neuer Tab erstellt." };
  }


  function getBaseName(path: string): string {
    const normalized = path.replace(/\\/g, "/");
    const parts = normalized.split("/");
    return parts[parts.length - 1] || path;
  }

  async function openFileFromDialog() {
    const res = await OpenFileDialogAndRead();
    if (!res) {
      status = { kind: "info", message: "Öffnen abgebrochen." };
      return;
    }

    const id = makeId();
    tabs = [
      ...tabs,
      { id, title: res.filename, path: res.path, lang: guessLang(res.type), value: res.content, dirty: false }
    ];
    activeId = id;
    status = { kind: "info", message: `${res.filename} geladen.` };
    outputValue = "";
    errorPosition = null;
  }

  async function saveActiveFile() {
    const tab = active();
    if (!tab.path) {
      await saveActiveFileAs();
      return;
    }

    const savedPath = await SaveFile(tab.path, tab.value);
    if (!savedPath) {
      status = { kind: "info", message: "Speichern abgebrochen." };
      return;
    }

    setActiveTab({ path: savedPath, title: getBaseName(savedPath), dirty: false });
    status = { kind: "ok", message: `${getBaseName(savedPath)} gespeichert.` };
  }

  async function saveActiveFileAs() {
    const tab = active();
    const savedPath = await SaveFileAs(tab.title, tab.value);
    if (!savedPath) {
      status = { kind: "info", message: "Speichern unter abgebrochen." };
      return;
    }

    setActiveTab({ path: savedPath, title: getBaseName(savedPath), dirty: false });
    status = { kind: "ok", message: `${getBaseName(savedPath)} gespeichert.` };
  }

  async function showAbout() {
    await ShowAboutDialog();
  }

  async function showPreferences() {
    await ShowPreferencesDialog();
  }

  function createNewFile() {
    createTabRightOfActive();
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
      { id, title: res.filename, path: res.path, lang: guessLang(res.type), value: res.content, dirty: false }
    ];
    activeId = id;
    status = { kind: "info", message: `${res.filename} geladen.` };
    outputValue = "";
    errorPosition = null;
  }

  async function runValidate() {
    const tab = active();
    const currentToken = ++processingToken;

    if (!(tab.lang === "json" || tab.lang === "xml")) {
      outputValue = tab.value;
      status = { kind: "info", message: "Validierung wird nur für JSON/XML unterstützt." };
      errorPosition = null;
      return;
    }

    isProcessing = true;
    try {
      const validation = await ValidateContent(tab.value, tab.lang);
      if (currentToken !== processingToken) return;

      status = { kind: validation.ok ? "ok" : "error", message: validation.message };
      if (validation.ok) {
        outputValue = tab.value;
        errorPosition = null;
      } else {
        outputValue = "";
        errorPosition = validation.line
          ? { line: validation.line, column: Math.max(1, validation.column || 1) }
          : null;
      }
    } finally {
      if (currentToken === processingToken) {
        isProcessing = false;
      }
    }
  }

  async function runFormat() {
    const tab = active();
    const currentToken = ++processingToken;

    if (!(tab.lang === "json" || tab.lang === "xml")) {
      outputValue = tab.value;
      status = { kind: "info", message: "Formatierung wird nur für JSON/XML unterstützt." };
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
        setActiveValue(formatting.output);
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

  function copyOutputToEditor() {
    if (!outputValue) {
      return;
    }

    setActiveValue(outputValue);
  }

  function compressJsonContent(content: string): string {
    return JSON.stringify(JSON.parse(content));
  }

  function compressXmlContent(content: string): string {
    return content
      .replace(/>\s+</g, "><")
      .replace(/\n/g, "")
      .trim();
  }

  function runCompress() {
    if (!outputValue) {
      status = { kind: "info", message: "Kein Output zum Komprimieren vorhanden." };
      return;
    }

    try {
      const lang = active().lang;
      if (lang === "json") {
        outputValue = compressJsonContent(outputValue);
      } else if (lang === "xml") {
        outputValue = compressXmlContent(outputValue);
      } else {
        outputValue = outputValue.trim();
      }

      status = { kind: "ok", message: "Output wurde komprimiert." };
      errorPosition = null;
    } catch (error) {
      status = { kind: "error", message: `Komprimieren fehlgeschlagen: ${(error as Error).message}` };
    }
  }

  async function copyOutputToClipboard() {
    if (!outputValue) {
      status = { kind: "info", message: "Kein Output zum Kopieren vorhanden." };
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(outputValue);
      } else {
        const helper = document.createElement("textarea");
        helper.value = outputValue;
        helper.setAttribute("readonly", "true");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.focus();
        helper.select();
        document.execCommand("copy");
        document.body.removeChild(helper);
      }

      status = { kind: "ok", message: "Output wurde in die Zwischenablage kopiert." };
    } catch (error) {
      status = { kind: "error", message: `Kopieren fehlgeschlagen: ${(error as Error).message}` };
    }
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
    setActiveTab({ title: file.name, path: undefined, lang, value: content, dirty: false });
    status = { kind: "info", message: `${file.name} geladen.` };
    outputValue = "";
    errorPosition = null;
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

      EventsOn("menu:new", createNewFile);
      EventsOn("menu:open", openFileFromDialog);
      EventsOn("menu:save", saveActiveFile);
      EventsOn("menu:saveas", saveActiveFileAs);
      EventsOn("menu:about", showAbout);
      EventsOn("menu:preferences", showPreferences);
    } catch (error) {
      console.error("Failed to initialize app runtime events:", error);
    }
  });
</script>

<style>
  .root {
    height: 100vh;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: #1e1e1e;
    color: #d4d4d4;
  }

  .toolbar {
    padding: 10px 12px;
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    border-bottom: 1px solid #2d2d2d;
    background: #252526;
  }

  .toolbar button {
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid #3f3f46;
    background: linear-gradient(#3c3c3c, #2f2f2f);
    color: #f3f4f6;
    font-size: 0.85rem;
    line-height: 1.2;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    transition: background 0.2s ease, border-color 0.2s ease;
  }

  .toolbar button:hover:enabled {
    background: linear-gradient(#4a4a4a, #373737);
    border-color: #575757;
  }

  .toolbar button:active:enabled {
    background: linear-gradient(#2b2b2b, #242424);
  }
  
  .margin-view-overlay {
    background-color: #dadada;
  }

  .tabs {
    display: flex;
    gap: 1px;
    padding: 0 8px;
    flex-wrap: wrap;
    background: #252526;
    border-bottom: 0px solid #333;
  }

  .tab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    border: 1px solid transparent;
    border-bottom: 0;
    border-radius: 6px 6px 0 0;
    background: #2d2d2d;
    color: #c7c7c7;
    cursor: pointer;
    max-width: 280px;
  }

  .tab:hover {
    background: #343434;
  }

  .tab.active {
    background: #dadada;
    border-color: #3a3a3a;
    color: #1e1e1e;
  }

  .tab-close {
    border: none;
    background: transparent;
    color: inherit;
    border-radius: 4px;
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-size: 0.8rem;
    opacity: 0.75;
    cursor: pointer;
  }

  .tab-close:hover {
    background: rgba(255, 255, 255, 0.15);
    opacity: 1;
  }

  .tab-title {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }


  .tab-new {
    border: 1px solid #3a3a3a;
    border-bottom: 0;
    border-radius: 6px 6px 0 0;
    margin-left: 4px;
    width: 28px;
    height: 30px;
    background: #2d2d2d;
    color: #c7c7c7;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    cursor: pointer;
  }

  .tab-new:hover {
    background: #3a3a3a;
    color: #fff;
  }

  .sidebyside {
    display: flex;
    gap: 8px;
    flex: 1;
    padding: 8px;
    min-height: 0;
    background: #dadada;
  }

  .editor {
    text-align: left;
    flex: 1;
    border: 0px solid #333;
    border-radius: 6px;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .output {
    text-align: left;
    flex: 1;
    min-width: 0;
    min-height: 0;
    border: 0px solid #333;
    border-radius: 6px;
    overflow: hidden;
  }

  .hint {
    margin-left: auto;
    opacity: 0.8;
    font-size: 0.85rem;
  }

  .footer {
    border-top: 1px solid #dadada;
    background: #252526;
  }

  .status {
    padding: 6px 10px;
    font-size: 0.85rem;
  }

  .status.info { color: #eaf5ff; }
  .status.ok { color: #d9ffdf; }
  .status.error { color: #ffe2e2; }
  button:disabled { opacity: 0.6; cursor: not-allowed; }

  @media (max-width: 980px) {
    .sidebyside {
      flex-direction: column;
    }

    .editor,
    .output {
      flex: 1;
    }
  }
</style>

<div class="root">
  <div class="toolbar">
    <button on:click={runFormat} disabled={!supportsActions() || isProcessing}>Format & Anwenden</button>
    <button on:click={runValidate} disabled={!supportsActions() || isProcessing}>Validate</button>
    <button on:click={runCompress} disabled={!outputValue || isProcessing}>Compress Output</button>
    <button on:click={copyOutputToEditor} disabled={!outputValue}>Output → Editor</button>
    <button on:click={copyOutputToClipboard} disabled={!outputValue}>Copy Output</button>
    <div class="hint">Drag & Drop: *.json / *.xml</div>
  </div>

  <div class="tabs" role="tablist" aria-label="Geöffnete Dateien">
    {#each tabs as t (t.id)}
      <div
        class="tab {t.id === activeId ? 'active' : ''}"
        title={t.path ?? ""}
        role="tab"
        aria-selected={t.id === activeId}
        tabindex="0"
        on:click={() => (activeId = t.id)}
        on:keydown={(event) => (event.key === "Enter" || event.key === " ") && (activeId = t.id)}
      >
        <button
          class="tab-close"
          type="button"
          aria-label={`${t.title} schließen`}
          on:click|stopPropagation={() => closeTab(t.id)}
        >
          ×
        </button>
        <span class="tab-title">{t.title}{t.dirty ? " *" : ""}</span>
      </div>
    {/each}
    <button
      class="tab-new"
      type="button"
      on:click={createTabRightOfActive}
      aria-label="Neuen Tab rechts vom aktiven Tab öffnen"
      title="Neuer Tab"
    >
      +
    </button>
  </div>

  <div class="sidebyside">
    <div
      class="editor"
      role="region"
      aria-label="Editor mit Drag-and-Drop für JSON/XML"
    >
      <MonacoEditor
        value={active().value}
        language={active().lang}
        errorPosition={errorPosition}
        onChange={setActiveValue}
        onDropFile={handleLocalFileDrop}
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
