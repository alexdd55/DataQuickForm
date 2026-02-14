<script lang="ts">
  import MonacoEditor from "./lib/MonacoEditor.svelte";
  import { OnFileDrop } from "../wailsjs/runtime/runtime";
  import { OpenFile } from "../wailsjs/go/main/App";

  type Tab = {
    id: string;
    title: string;
    path?: string;
    lang: "json" | "xml" | "plaintext";
    value: string;
  };

  let tabs: Tab[] = [
    { id: crypto.randomUUID(), title: "Untitled.json", lang: "json", value: "{\n  \n}\n" }
  ];
  let activeId = tabs[0].id;

  const active = () => tabs.find(t => t.id === activeId)!;

  function setActiveValue(v: string) {
    tabs = tabs.map(t => t.id === activeId ? { ...t, value: v } : t);
  }

  function guessLang(type: string): Tab["lang"] {
    if (type === "json") return "json";
    if (type === "xml") return "xml";
    return "plaintext";
  }

  async function openPath(path: string) {
    const res = await OpenFile(path);
    const id = crypto.randomUUID();
    tabs = [
      ...tabs,
      { id, title: res.filename, path: res.path, lang: guessLang(res.type), value: res.content }
    ];
    activeId = id;
  }

  // Drag & Drop initialisieren
  OnFileDrop(async (_x: number, _y: number, paths: string[]) => {
    for (const p of paths) {
      const lower = p.toLowerCase();
      if (lower.endsWith(".json") || lower.endsWith(".xml")) {
        await openPath(p);
      }
    }
  }, false); // useDropTarget=false: ganzer Window-Bereich
</script>

<style>
  .root { height: 100vh; display: flex; flex-direction: column; }
  .toolbar { padding: 8px; display: flex; gap: 8px; align-items: center; }
  .tabs { display: flex; gap: 6px; padding: 0 8px 8px 8px; flex-wrap: wrap; }
  .tab { padding: 6px 10px; border-radius: 8px; border: 1px solid #ccc; background: white; cursor: pointer; }
  .tab.active { border: 2px solid #888; }
  .editor { flex: 1; }
  .hint { margin-left: auto; opacity: 0.7; }
</style>

<div class="root">
  <div class="toolbar">
    <button on:click={() => alert("Format/Validate/Convert kommt als nächster Schritt")}>Format</button>
    <button on:click={() => alert("Validate kommt als nächster Schritt")}>Validate</button>
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

  <div class="editor">
    <MonacoEditor
      value={active().value}
      language={active().lang}
      onChange={setActiveValue}
    />
  </div>
</div>
