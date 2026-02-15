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
    ValidateContent
  } from "../wailsjs/go/main/App";

  type Locale = "en" | "de" | "es" | "pt" | "fr";

  const LOCALE_STORAGE_KEY = "dqf.language";

  const localeNames: Record<Locale, string> = {
    en: "English",
    de: "Deutsch",
    es: "Español",
    pt: "Português",
    fr: "Français"
  };

  const translations = {
    appReady: {
      en: "Ready.",
      de: "Bereit.",
      es: "Listo.",
      pt: "Pronto.",
      fr: "Prêt."
    },
    untitled: {
      en: "Untitled.json",
      de: "Unbenannt.json",
      es: "Sin título.json",
      pt: "Sem título.json",
      fr: "Sans titre.json"
    },
    newTabCreated: {
      en: "New tab created.",
      de: "Neuer Tab erstellt.",
      es: "Nueva pestaña creada.",
      pt: "Nova aba criada.",
      fr: "Nouvel onglet créé."
    },
    dialogOpenCanceled: {
      en: "Open canceled.",
      de: "Öffnen abgebrochen.",
      es: "Apertura cancelada.",
      pt: "Abertura cancelada.",
      fr: "Ouverture annulée."
    },
    saveCanceled: {
      en: "Save canceled.",
      de: "Speichern abgebrochen.",
      es: "Guardado cancelado.",
      pt: "Salvar cancelado.",
      fr: "Enregistrement annulé."
    },
    saveAsCanceled: {
      en: "Save as canceled.",
      de: "Speichern unter abgebrochen.",
      es: "Guardar como cancelado.",
      pt: "Salvar como cancelado.",
      fr: "Enregistrer sous annulé."
    },
    loadedFile: {
      en: "{name} loaded.",
      de: "{name} geladen.",
      es: "{name} cargado.",
      pt: "{name} carregado.",
      fr: "{name} chargé."
    },
    savedFile: {
      en: "{name} saved.",
      de: "{name} gespeichert.",
      es: "{name} guardado.",
      pt: "{name} salvo.",
      fr: "{name} enregistré."
    },
    closedTab: {
      en: "{name} closed.",
      de: "{name} geschlossen.",
      es: "{name} cerrada.",
      pt: "{name} fechada.",
      fr: "{name} fermé."
    },
    onlyJsonXmlValidation: {
      en: "Validation is only supported for JSON/XML.",
      de: "Validierung wird nur für JSON/XML unterstützt.",
      es: "La validación solo es compatible con JSON/XML.",
      pt: "A validação só é compatível com JSON/XML.",
      fr: "La validation est prise en charge uniquement pour JSON/XML."
    },
    onlyJsonXmlFormatting: {
      en: "Formatting is only supported for JSON/XML.",
      de: "Formatierung wird nur für JSON/XML unterstützt.",
      es: "El formateo solo es compatible con JSON/XML.",
      pt: "A formatação só é compatível com JSON/XML.",
      fr: "Le formatage est pris en charge uniquement pour JSON/XML."
    },
    noOutputToCompress: {
      en: "No output to compress.",
      de: "Kein Output zum Komprimieren vorhanden.",
      es: "No hay salida para comprimir.",
      pt: "Não há saída para compactar.",
      fr: "Aucune sortie à compresser."
    },
    outputCompressed: {
      en: "Output compressed.",
      de: "Output wurde komprimiert.",
      es: "Salida comprimida.",
      pt: "Saída compactada.",
      fr: "Sortie compressée."
    },
    compressFailed: {
      en: "Compression failed: {error}",
      de: "Komprimieren fehlgeschlagen: {error}",
      es: "Compresión fallida: {error}",
      pt: "Falha ao compactar: {error}",
      fr: "Échec de la compression : {error}"
    },
    noOutputToCopy: {
      en: "No output to copy.",
      de: "Kein Output zum Kopieren vorhanden.",
      es: "No hay salida para copiar.",
      pt: "Não há saída para copiar.",
      fr: "Aucune sortie à copier."
    },
    outputCopied: {
      en: "Output copied to clipboard.",
      de: "Output wurde in die Zwischenablage kopiert.",
      es: "Salida copiada al portapapeles.",
      pt: "Saída copiada para a área de transferência.",
      fr: "Sortie copiée dans le presse-papiers."
    },
    copyFailed: {
      en: "Copy failed: {error}",
      de: "Kopieren fehlgeschlagen: {error}",
      es: "Error al copiar: {error}",
      pt: "Falha ao copiar: {error}",
      fr: "Échec de la copie : {error}"
    },
    dropOnlyJsonXml: {
      en: "Please drop only JSON or XML files.",
      de: "Bitte nur JSON- oder XML-Dateien ablegen.",
      es: "Arrastra solo archivos JSON o XML.",
      pt: "Arraste apenas arquivos JSON ou XML.",
      fr: "Déposez uniquement des fichiers JSON ou XML."
    },
    languageUpdated: {
      en: "Language set to {language}.",
      de: "Sprache auf {language} gesetzt.",
      es: "Idioma configurado en {language}.",
      pt: "Idioma definido para {language}.",
      fr: "Langue définie sur {language}."
    },
    actionFormatApply: {
      en: "Format & Apply",
      de: "Formatieren & Anwenden",
      es: "Formatear y aplicar",
      pt: "Formatar e aplicar",
      fr: "Formater et appliquer"
    },
    actionValidate: {
      en: "Validate",
      de: "Validieren",
      es: "Validar",
      pt: "Validar",
      fr: "Valider"
    },
    actionCompressOutput: {
      en: "Compress output",
      de: "Output komprimieren",
      es: "Comprimir salida",
      pt: "Compactar saída",
      fr: "Compresser la sortie"
    },
    actionOutputToEditor: {
      en: "Output → Editor",
      de: "Output → Editor",
      es: "Salida → Editor",
      pt: "Saída → Editor",
      fr: "Sortie → Éditeur"
    },
    actionCopyOutput: {
      en: "Copy output",
      de: "Output kopieren",
      es: "Copiar salida",
      pt: "Copiar saída",
      fr: "Copier la sortie"
    },
    dragAndDropHint: {
      en: "Drag & Drop: *.json / *.xml",
      de: "Drag & Drop: *.json / *.xml",
      es: "Arrastrar y soltar: *.json / *.xml",
      pt: "Arrastar e soltar: *.json / *.xml",
      fr: "Glisser-déposer : *.json / *.xml"
    },
    openedFiles: {
      en: "Opened files",
      de: "Geöffnete Dateien",
      es: "Archivos abiertos",
      pt: "Arquivos abertos",
      fr: "Fichiers ouverts"
    },
    closeTabLabel: {
      en: "Close {name}",
      de: "{name} schließen",
      es: "Cerrar {name}",
      pt: "Fechar {name}",
      fr: "Fermer {name}"
    },
    newTabAria: {
      en: "Open a new tab to the right of the active tab",
      de: "Neuen Tab rechts vom aktiven Tab öffnen",
      es: "Abrir una nueva pestaña a la derecha de la pestaña activa",
      pt: "Abrir uma nova aba à direita da aba ativa",
      fr: "Ouvrir un nouvel onglet à droite de l'onglet actif"
    },
    newTabTitle: {
      en: "New tab",
      de: "Neuer Tab",
      es: "Nueva pestaña",
      pt: "Nova aba",
      fr: "Nouvel onglet"
    },
    editorRegionLabel: {
      en: "Editor with drag and drop for JSON/XML",
      de: "Editor mit Drag-and-Drop für JSON/XML",
      es: "Editor con arrastrar y soltar para JSON/XML",
      pt: "Editor com arrastar e soltar para JSON/XML",
      fr: "Éditeur avec glisser-déposer pour JSON/XML"
    },
    preferencesTitle: {
      en: "Settings",
      de: "Einstellungen",
      es: "Ajustes",
      pt: "Configurações",
      fr: "Paramètres"
    },
    languageLabel: {
      en: "Language",
      de: "Sprache",
      es: "Idioma",
      pt: "Idioma",
      fr: "Langue"
    },
    close: {
      en: "Close",
      de: "Schließen",
      es: "Cerrar",
      pt: "Fechar",
      fr: "Fermer"
    }
  } as const;

  type TranslationKey = keyof typeof translations;

  function isLocale(value: string): value is Locale {
    return value === "en" || value === "de" || value === "es" || value === "pt" || value === "fr";
  }

  function detectInitialLocale(): Locale {
    if (typeof localStorage === "undefined") {
      return "en";
    }

    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && isLocale(saved)) {
      return saved;
    }

    return "en";
  }

  let locale: Locale = detectInitialLocale();
  let preferencesOpen = false;

  function t(key: TranslationKey, vars: Record<string, string> = {}): string {
    let text: string = translations[key][locale];
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, value);
    }
    return text;
  }

  function setLocale(nextLocale: Locale) {
    locale = nextLocale;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    }
    status = { kind: "info", message: t("languageUpdated", { language: localeNames[nextLocale] }) };
  }

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
    return { id: makeId(), title: t("untitled"), lang: "json", value: "{\n  \n}\n", dirty: false };
  }

  let tabs: Tab[] = [createUntitledTab()];
  let activeId = tabs[0].id;
  let status: Status = { kind: "info", message: t("appReady") };
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
    status = { kind: "info", message: t("closedTab", { name: closedTab.title }) };
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
    status = { kind: "info", message: t("newTabCreated") };
  }


  function getBaseName(path: string): string {
    const normalized = path.replace(/\\/g, "/");
    const parts = normalized.split("/");
    return parts[parts.length - 1] || path;
  }

  async function openFileFromDialog() {
    const res = await OpenFileDialogAndRead();
    if (!res) {
      status = { kind: "info", message: t("dialogOpenCanceled") };
      return;
    }

    const id = makeId();
    tabs = [
      ...tabs,
      { id, title: res.filename, path: res.path, lang: guessLang(res.type), value: res.content, dirty: false }
    ];
    activeId = id;
    status = { kind: "info", message: t("loadedFile", { name: res.filename }) };
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
      status = { kind: "info", message: t("saveCanceled") };
      return;
    }

    setActiveTab({ path: savedPath, title: getBaseName(savedPath), dirty: false });
    status = { kind: "ok", message: t("savedFile", { name: getBaseName(savedPath) }) };
  }

  async function saveActiveFileAs() {
    const tab = active();
    const savedPath = await SaveFileAs(tab.title, tab.value);
    if (!savedPath) {
      status = { kind: "info", message: t("saveAsCanceled") };
      return;
    }

    setActiveTab({ path: savedPath, title: getBaseName(savedPath), dirty: false });
    status = { kind: "ok", message: t("savedFile", { name: getBaseName(savedPath) }) };
  }

  async function showAbout() {
    await ShowAboutDialog();
  }

  function showPreferences() {
    preferencesOpen = true;
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
    status = { kind: "info", message: t("loadedFile", { name: res.filename }) };
    outputValue = "";
    errorPosition = null;
  }

  async function runValidate() {
    const tab = active();
    const currentToken = ++processingToken;

    if (!(tab.lang === "json" || tab.lang === "xml")) {
      outputValue = tab.value;
      status = { kind: "info", message: t("onlyJsonXmlValidation") };
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
      status = { kind: "info", message: t("onlyJsonXmlFormatting") };
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
      status = { kind: "info", message: t("noOutputToCompress") };
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

      status = { kind: "ok", message: t("outputCompressed") };
      errorPosition = null;
    } catch (error) {
      status = { kind: "error", message: t("compressFailed", { error: (error as Error).message }) };
    }
  }

  async function copyOutputToClipboard() {
    if (!outputValue) {
      status = { kind: "info", message: t("noOutputToCopy") };
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

      status = { kind: "ok", message: t("outputCopied") };
    } catch (error) {
      status = { kind: "error", message: t("copyFailed", { error: (error as Error).message }) };
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
      status = { kind: "error", message: t("dropOnlyJsonXml") };
      return;
    }

    const content = await file.text();
    setActiveTab({ title: file.name, path: undefined, lang, value: content, dirty: false });
    status = { kind: "info", message: t("loadedFile", { name: file.name }) };
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

  .preferences-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
  }

  .preferences-dialog {
    background: #252526;
    color: #f3f4f6;
    border: 1px solid #3f3f46;
    border-radius: 8px;
    width: min(360px, calc(100vw - 32px));
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .preferences-dialog h2 {
    margin: 0;
    font-size: 1rem;
  }

  .preferences-dialog select {
    background: #2d2d2d;
    color: #f3f4f6;
    border: 1px solid #3f3f46;
    border-radius: 6px;
    padding: 6px;
  }

  .preferences-dialog button {
    align-self: flex-end;
  }

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
    <button on:click={runFormat} disabled={!supportsActions() || isProcessing}>{t("actionFormatApply")}</button>
    <button on:click={runValidate} disabled={!supportsActions() || isProcessing}>{t("actionValidate")}</button>
    <button on:click={runCompress} disabled={!outputValue || isProcessing}>{t("actionCompressOutput")}</button>
    <button on:click={copyOutputToEditor} disabled={!outputValue}>{t("actionOutputToEditor")}</button>
    <button on:click={copyOutputToClipboard} disabled={!outputValue}>{t("actionCopyOutput")}</button>
    <div class="hint">{t("dragAndDropHint")}</div>
  </div>

  <div class="tabs" role="tablist" aria-label={t("openedFiles")}>
    {#each tabs as tab (tab.id)}
      <div
        class="tab {tab.id === activeId ? 'active' : ''}"
        title={tab.path ?? ""}
        role="tab"
        aria-selected={tab.id === activeId}
        tabindex="0"
        on:click={() => (activeId = tab.id)}
        on:keydown={(event) => (event.key === "Enter" || event.key === " ") && (activeId = tab.id)}
      >
        <button
          class="tab-close"
          type="button"
          aria-label={t("closeTabLabel", { name: tab.title })}
          on:click|stopPropagation={() => closeTab(tab.id)}
        >
          ×
        </button>
        <span class="tab-title">{tab.title}{tab.dirty ? " *" : ""}</span>
      </div>
    {/each}
    <button
      class="tab-new"
      type="button"
      on:click={createTabRightOfActive}
      aria-label={t("newTabAria")}
      title={t("newTabTitle")}
    >
      +
    </button>
  </div>

  <div class="sidebyside">
    <div
      class="editor"
      role="region"
      aria-label={t("editorRegionLabel")}
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

{#if preferencesOpen}
  <div class="preferences-backdrop">
    <div class="preferences-dialog" role="dialog" tabindex="-1" aria-modal="true" aria-label={t("preferencesTitle")}>
      <h2>{t("preferencesTitle")}</h2>
      <label for="language-select">{t("languageLabel")}</label>
      <select
        id="language-select"
        value={locale}
        on:change={(event) => setLocale((event.currentTarget as HTMLSelectElement).value as Locale)}
      >
        {#each Object.entries(localeNames) as [code, label]}
          <option value={code}>{label}</option>
        {/each}
      </select>
      <button type="button" on:click={() => (preferencesOpen = false)}>{t("close")}</button>
    </div>
  </div>
{/if}
