<script lang="ts">
  import { onMount } from "svelte";
  import MonacoEditor from "./lib/MonacoEditor.svelte";
  import { getActionEditorTab, getActiveEditorTab, getActiveTab, getSourceEditorTabForDiff } from "./lib/tabState";
  import type { DiffTab, EditorTab, Tab } from "./lib/tabState";
  import { ClipboardGetText, ClipboardSetText, EventsOn, OnFileDrop } from "../wailsjs/runtime/runtime";
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
  type ThemePreference = "system" | "light" | "dark";
  type ResolvedTheme = "light" | "dark";

  const LOCALE_STORAGE_KEY = "dqf.language";
  const THEME_STORAGE_KEY = "dqf.theme";

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
    clipboardUnavailable: {
      en: "Clipboard read is not available.",
      de: "Zwischenablage kann nicht gelesen werden.",
      es: "La lectura del portapapeles no está disponible.",
      pt: "A leitura da área de transferência não está disponível.",
      fr: "La lecture du presse-papiers n'est pas disponible."
    },
    clipboardReadFailed: {
      en: "Reading clipboard failed: {error}",
      de: "Lesen der Zwischenablage fehlgeschlagen: {error}",
      es: "Error al leer el portapapeles: {error}",
      pt: "Falha ao ler a área de transferência: {error}",
      fr: "Échec de la lecture du presse-papiers : {error}"
    },
    diffTabTitle: {
      en: "Diff: {name} ↔ Clipboard",
      de: "Diff: {name} ↔ Zwischenablage",
      es: "Diff: {name} ↔ Portapapeles",
      pt: "Diff: {name} ↔ Área de transferência",
      fr: "Diff : {name} ↔ Presse-papiers"
    },
    diffCreated: {
      en: "Clipboard diff opened.",
      de: "Zwischenablage-Diff geöffnet.",
      es: "Diferencia con portapapeles abierta.",
      pt: "Diff da área de transferência aberto.",
      fr: "Diff du presse-papiers ouvert."
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
    actionCompareClipboard: {
      en: "Compare with clipboard",
      de: "Mit Zwischenablage vergleichen",
      es: "Comparar con portapapeles",
      pt: "Comparar com a área de transferência",
      fr: "Comparer avec le presse-papiers"
    },
    actionUndo: {
      en: "Undo",
      de: "Rückgängig",
      es: "Deshacer",
      pt: "Desfazer",
      fr: "Annuler"
    },
    actionRedo: {
      en: "Redo",
      de: "Wiederholen",
      es: "Rehacer",
      pt: "Refazer",
      fr: "Rétablir"
    },
    actionClearEditor: {
      en: "Clear editor",
      de: "Editor leeren",
      es: "Limpiar editor",
      pt: "Limpar editor",
      fr: "Effacer l'éditeur"
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

    themeLabel: {
      en: "Theme",
      de: "Darstellung",
      es: "Tema",
      pt: "Tema",
      fr: "Thème"
    },
    themeOptionSystem: {
      en: "System",
      de: "System",
      es: "Sistema",
      pt: "Sistema",
      fr: "Système"
    },
    themeOptionLight: {
      en: "Light",
      de: "Hell",
      es: "Claro",
      pt: "Claro",
      fr: "Clair"
    },
    themeOptionDark: {
      en: "Dark",
      de: "Dunkel",
      es: "Oscuro",
      pt: "Escuro",
      fr: "Sombre"
    },
    themeUpdated: {
      en: "Theme set to {theme}.",
      de: "Darstellung auf {theme} gesetzt.",
      es: "Tema configurado en {theme}.",
      pt: "Tema definido para {theme}.",
      fr: "Thème défini sur {theme}."
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

  function isThemePreference(value: string): value is ThemePreference {
    return value === "system" || value === "light" || value === "dark";
  }

  function detectInitialThemePreference(): ThemePreference {
    if (typeof localStorage === "undefined") {
      return "system";
    }

    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && isThemePreference(saved)) {
      return saved;
    }

    return "system";
  }

  function detectSystemTheme(): ResolvedTheme {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return "light";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }


  let locale: Locale = detectInitialLocale();
  let themePreference: ThemePreference = detectInitialThemePreference();
  let systemTheme: ResolvedTheme = detectSystemTheme();
  let preferencesOpen = false;


  $: effectiveTheme = themePreference === "system" ? systemTheme : themePreference;

  function t(key: TranslationKey, vars: Record<string, string> = {}): string {
    let text: string = translations[key][locale];
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, value);
    }
    return text;
  }


  function setThemePreference(nextThemePreference: ThemePreference) {
    themePreference = nextThemePreference;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, nextThemePreference);
    }

    const themeLabel = nextThemePreference === "system"
      ? t("themeOptionSystem")
      : nextThemePreference === "light"
        ? t("themeOptionLight")
        : t("themeOptionDark");

    status = { kind: "info", message: t("themeUpdated", { theme: themeLabel }) };
  }

  function setLocale(nextLocale: Locale) {
    locale = nextLocale;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    }
    status = { kind: "info", message: t("languageUpdated", { language: localeNames[nextLocale] }) };
  }


  type Status = {
    kind: "ok" | "error" | "info";
    message: string;
  };

  type ErrorPosition = {
    line: number;
    column: number;
  } | null;

  type AppPlatform = "macos" | "windows" | "linux";

  function detectPlatform(): AppPlatform {
    if (typeof navigator === "undefined") {
      return "linux";
    }

    const source = [navigator.platform, navigator.userAgent]
      .filter((value) => typeof value === "string")
      .join(" ")
      .toLowerCase();

    if (source.includes("mac")) {
      return "macos";
    }
    if (source.includes("win")) {
      return "windows";
    }
    return "linux";
  }

  function makeId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function createUntitledTab(): Tab {
    return {
      id: makeId(),
      kind: "editor",
      title: t("untitled"),
      lang: "json",
      value: "{\n  \n}\n",
      dirty: false,
      undoHistory: [],
      redoHistory: []
    };
  }

  let tabs: Tab[] = [createUntitledTab()];
  let activeId = tabs[0].id;
  let status: Status = { kind: "info", message: t("appReady") };
  let isProcessing = false;
  let errorPosition: ErrorPosition = null;
  let outputValue = "";
  let processingToken = 0;
  let appPlatform: AppPlatform = detectPlatform();

  const active = () => getActiveTab(tabs, activeId);
  const activeEditor = (): EditorTab | null => getActiveEditorTab(tabs, activeId);
  const sourceEditorForDiff = (): EditorTab | null => getSourceEditorTabForDiff(tabs, activeId);
  const actionEditor = (): EditorTab | null => getActionEditorTab(tabs, activeId);


  function setEditorValue(editorId: string, v: string, options: { recordUndo?: boolean } = {}) {
    const { recordUndo = true } = options;
    const index = tabs.findIndex((t) => t.id === editorId);
    if (index === -1) {
      return;
    }

    const current = tabs[index];
    if (current.kind !== "editor" || current.value === v) {
      return;
    }

    tabs = [
      ...tabs.slice(0, index),
      {
        ...current,
        value: v,
        dirty: true,
        undoHistory: recordUndo ? [...current.undoHistory, current.value].slice(-200) : current.undoHistory,
        redoHistory: recordUndo ? [] : current.redoHistory
      },
      ...tabs.slice(index + 1)
    ];
  }

  function setActiveValue(v: string, options: { recordUndo?: boolean } = {}) {
    const tab = activeEditor();
    if (!tab) {
      return;
    }

    setEditorValue(tab.id, v, options);
  }

  function setActiveDiffValue(v: string) {
    const index = tabs.findIndex((t) => t.id === activeId);
    if (index === -1) {
      return;
    }

    const current = tabs[index];
    if (current.kind !== "diff" || current.value === v) {
      return;
    }

    tabs = [
      ...tabs.slice(0, index),
      { ...current, value: v },
      ...tabs.slice(index + 1)
    ];
  }

  function setEditorTab(editorId: string, tab: Partial<EditorTab>) {
    const index = tabs.findIndex((t) => t.id === editorId);
    if (index === -1) {
      return;
    }

    const current = tabs[index];
    if (current.kind !== "editor") {
      return;
    }

    tabs = [
      ...tabs.slice(0, index),
      { ...current, ...tab },
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
      {
        id,
        kind: "editor",
        title: res.filename,
        path: res.path,
        lang: guessLang(res.type),
        value: res.content,
        dirty: false,
        undoHistory: [],
        redoHistory: []
      }
    ];
    activeId = id;
    status = { kind: "info", message: t("loadedFile", { name: res.filename }) };
    outputValue = "";
    errorPosition = null;
  }

  async function saveActiveFile() {
    const tab = actionEditor();
    if (!tab) {
      return;
    }

    if (!tab.path) {
      await saveActiveFileAs();
      return;
    }

    const savedPath = await SaveFile(tab.path, tab.value);
    if (!savedPath) {
      status = { kind: "info", message: t("saveCanceled") };
      return;
    }

    setEditorTab(tab.id, { path: savedPath, title: getBaseName(savedPath), dirty: false });
    status = { kind: "ok", message: t("savedFile", { name: getBaseName(savedPath) }) };
  }

  async function saveActiveFileAs() {
    const tab = actionEditor();
    if (!tab) {
      return;
    }
    const savedPath = await SaveFileAs(tab.title, tab.value);
    if (!savedPath) {
      status = { kind: "info", message: t("saveAsCanceled") };
      return;
    }

    setEditorTab(tab.id, { path: savedPath, title: getBaseName(savedPath), dirty: false });
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
    const tab = actionEditor();
    return !!tab && (tab.lang === "json" || tab.lang === "xml");
  }

  async function openPath(path: string) {
    const res = await OpenFile(path);
    const id = makeId();
    tabs = [
      ...tabs,
      {
        id,
        kind: "editor",
        title: res.filename,
        path: res.path,
        lang: guessLang(res.type),
        value: res.content,
        dirty: false,
        undoHistory: [],
        redoHistory: []
      }
    ];
    activeId = id;
    status = { kind: "info", message: t("loadedFile", { name: res.filename }) };
    outputValue = "";
    errorPosition = null;
  }

  async function runValidate() {
    const tab = actionEditor();
    if (!tab) {
      return;
    }
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
    const tab = actionEditor();
    if (!tab) {
      return;
    }
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
        setEditorValue(tab.id, formatting.output);
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
    const tab = actionEditor();
    if (!outputValue || !tab) {
      return;
    }

    setEditorValue(tab.id, outputValue);
  }

  function canUndoActive(): boolean {
    const tab = actionEditor();
    return !!tab && tab.undoHistory.length > 0;
  }

  function canRedoActive(): boolean {
    const tab = actionEditor();
    return !!tab && tab.redoHistory.length > 0;
  }

  function undoActiveTab() {
    const tab = actionEditor();
    if (!tab || tab.undoHistory.length === 0) {
      return;
    }

    const previousValue = tab.undoHistory[tab.undoHistory.length - 1];
    const index = tabs.findIndex((t) => t.id === tab.id);
    if (index === -1) {
      return;
    }

    tabs = [
      ...tabs.slice(0, index),
      {
        ...tab,
        value: previousValue,
        dirty: true,
        undoHistory: tab.undoHistory.slice(0, -1),
        redoHistory: [...tab.redoHistory, tab.value].slice(-200)
      },
      ...tabs.slice(index + 1)
    ];
  }

  function redoActiveTab() {
    const tab = actionEditor();
    if (!tab || tab.redoHistory.length === 0) {
      return;
    }

    const nextValue = tab.redoHistory[tab.redoHistory.length - 1];
    const index = tabs.findIndex((t) => t.id === tab.id);
    if (index === -1) {
      return;
    }

    tabs = [
      ...tabs.slice(0, index),
      {
        ...tab,
        value: nextValue,
        dirty: true,
        undoHistory: [...tab.undoHistory, tab.value].slice(-200),
        redoHistory: tab.redoHistory.slice(0, -1)
      },
      ...tabs.slice(index + 1)
    ];
  }

  function clearActiveTab() {
    const currentTab = active();

    if (currentTab.kind === "diff") {
      if (!currentTab.value) {
        return;
      }

      setActiveDiffValue("");
      errorPosition = null;
      return;
    }

    if (!currentTab.value) {
      return;
    }

    setEditorValue(currentTab.id, "");
    errorPosition = null;
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
      const lang = actionEditor()?.lang ?? active().lang;
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
      let copied = false;

      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(outputValue);
          copied = true;
        } catch {
          copied = false;
        }
      }

      if (!copied && typeof ClipboardSetText === "function") {
        await ClipboardSetText(outputValue);
        copied = true;
      }

      if (!copied) {
        const helper = document.createElement("textarea");
        helper.value = outputValue;
        helper.setAttribute("readonly", "true");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.focus();
        helper.select();
        copied = document.execCommand("copy");
        document.body.removeChild(helper);
      }

      if (!copied) {
        throw new Error("Clipboard copy is unavailable.");
      }

      status = { kind: "ok", message: t("outputCopied") };
    } catch (error) {
      status = { kind: "error", message: t("copyFailed", { error: (error as Error).message }) };
    }
  }


  async function compareWithClipboard() {
    const tab = actionEditor();
    if (!tab) {
      return;
    }

    const comparisonValue = outputValue || tab.value;

    try {
      let clipboardValue = "";
      let read = false;

      if (navigator.clipboard?.readText) {
        try {
          clipboardValue = await navigator.clipboard.readText();
          read = true;
        } catch {
          read = false;
        }
      }

      if (!read && typeof ClipboardGetText === "function") {
        clipboardValue = await ClipboardGetText();
        read = true;
      }

      if (!read) {
        status = { kind: "error", message: t("clipboardUnavailable") };
        return;
      }

      const id = makeId();
      const diffTab: DiffTab = {
        id,
        kind: "diff",
        sourceEditorId: tab.id,
        title: t("diffTabTitle", { name: tab.title }),
        lang: tab.lang,
        originalValue: comparisonValue,
        value: clipboardValue
      };

      const activeIndex = tabs.findIndex((item) => item.id === activeId);
      const insertIndex = activeIndex === -1 ? tabs.length : activeIndex + 1;
      tabs = [
        ...tabs.slice(0, insertIndex),
        diffTab,
        ...tabs.slice(insertIndex)
      ];
      activeId = id;
      outputValue = comparisonValue;
      status = { kind: "ok", message: t("diffCreated") };
    } catch (error) {
      status = { kind: "error", message: t("clipboardReadFailed", { error: (error as Error).message }) };
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
    const targetTab = actionEditor();
    if (!targetTab) {
      return;
    }

    setEditorTab(targetTab.id, {
      title: file.name,
      path: undefined,
      lang,
      value: content,
      dirty: false,
      undoHistory: [],
      redoHistory: []
    });
    status = { kind: "info", message: t("loadedFile", { name: file.name }) };
    outputValue = "";
    errorPosition = null;
  }

  onMount(() => {
    const mediaQuery = typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      systemTheme = event.matches ? "dark" : "light";
    };

    if (mediaQuery) {
      systemTheme = mediaQuery.matches ? "dark" : "light";
      mediaQuery.addEventListener("change", handleSystemThemeChange);
    }

    (async () => {
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
    })();

    return () => {
      mediaQuery?.removeEventListener("change", handleSystemThemeChange);
    };
  });
</script>

<style>
  .root {
    --toolbar-button-radius: 8px;
    --ui-font: "Inter", "Segoe UI", system-ui, sans-serif;
    --pref-dialog-bg: rgba(248, 250, 254, 0.95);
    --pref-dialog-color: #1f2430;
    --pref-border-color: #c5cfdf;
    --pref-select-bg: #ffffff;
    --pref-select-border: #bdc8da;
    --pref-button-bg: linear-gradient(180deg, #ffffff 0%, #edf2fa 100%);

    height: 100vh;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: #edf0f3;
    color: #1f1f1f;
    font-family: var(--ui-font);
    padding: 0;
    box-sizing: border-box;
    overflow: hidden;
  }

  .root.platform-macos {
    --toolbar-button-radius: 999px;
    --ui-font: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #e7ecf4;
  }

  .root.platform-windows {
    --toolbar-button-radius: 6px;
    --ui-font: "Segoe UI", "Inter", Arial, sans-serif;
    background: #e4ebf7;
  }

  .root.platform-linux {
    --toolbar-button-radius: 6px;
    --ui-font: "Ubuntu", "Cantarell", "Noto Sans", "Segoe UI", sans-serif;
    background: #e9ebef;
  }


  .root.theme-dark {
    background: #141922;
    color: #e7ecf5;
    --pref-dialog-bg: rgba(30, 39, 56, 0.98);
    --pref-dialog-color: #e7ecf5;
    --pref-border-color: #4f607f;
    --pref-select-bg: #1f2a3c;
    --pref-select-border: #536685;
    --pref-button-bg: linear-gradient(180deg, #334158 0%, #243145 100%);
  }

  .root.theme-dark .toolbar {
    border-bottom: 1px solid rgba(104, 122, 156, 0.55);
    background: rgba(27, 34, 48, 0.92);
  }

  .root.theme-dark .toolbar button {
    border: 1px solid #4f607f;
    background: linear-gradient(180deg, #334158 0%, #243145 100%);
    color: #e7ecf5;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .root.theme-dark .toolbar button:hover:enabled {
    background: linear-gradient(180deg, #3a4b66 0%, #2b3a51 100%);
    border-color: #6e82a6;
  }

  .root.theme-dark .toolbar button:active:enabled {
    background: linear-gradient(180deg, #25344a 0%, #1f2d41 100%);
  }

  .root.theme-dark .tabs {
    background: #1b2433;
    border-bottom: 1px solid rgba(94, 112, 146, 0.58);
  }

  .root.theme-dark .tab {
    border-color: #4f607f;
    background: linear-gradient(180deg, #2d3a50 0%, #253245 100%);
    color: #c8d2e4;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .root.theme-dark .tab:hover {
    background: linear-gradient(180deg, #374a64 0%, #2b3a51 100%);
  }

  .root.theme-dark .tab.active {
    background: linear-gradient(180deg, #3b4f6f 0%, #31455f 100%);
    border-color: #6880ab;
    color: #eef3ff;
    box-shadow: inset 0 2px 0 rgba(160, 188, 234, 0.18);
  }

  .root.theme-dark .tab-close:hover {
    background: rgba(177, 200, 235, 0.2);
  }

  .root.theme-dark .tab-new {
    border-color: #4f607f;
    background: linear-gradient(180deg, #2d3a50 0%, #253245 100%);
    color: #c8d2e4;
  }

  .root.theme-dark .tab-new:hover {
    background: linear-gradient(180deg, #3a4b66 0%, #2b3a51 100%);
    color: #eff4ff;
  }

  .root.theme-dark .sidebyside {
    background: rgba(20, 27, 38, 0.88);
  }

  .root.theme-dark .editor,
  .root.theme-dark .output {
    border: 1px solid #4f607f;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .root.theme-dark .diff-funnel {
    border: 1px solid rgba(111, 140, 192, 0.45);
    background: linear-gradient(180deg, rgba(89, 122, 175, 0.28), rgba(89, 122, 175, 0.14));
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  }

  .root.theme-dark .diff-funnel-icon {
    background: rgba(104, 136, 190, 0.92);
    color: #f4f8ff;
  }

  .root.theme-dark .hint {
    color: #aebad0;
  }

  .root.theme-dark .footer {
    border-top: 1px solid rgba(86, 104, 136, 0.75);
    background: rgba(24, 31, 44, 0.92);
  }

  .root.theme-dark .status.info { color: #8cb6ff; }
  .root.theme-dark .status.ok { color: #7ed39a; }
  .root.theme-dark .status.error { color: #ff8e9b; }


  .toolbar {
    padding: 0;
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    border-bottom: 1px solid rgba(189, 198, 213, 0.7);
    background: rgba(247, 249, 252, 0.76);
  }

  .toolbar button {
    padding: 7px 14px;
    border-radius: var(--toolbar-button-radius);
    border: 1px solid #c2cad8;
    background: linear-gradient(180deg, #ffffff 0%, #e9edf4 100%);
    color: #232a36;
    font-size: 0.85rem;
    font-weight: 500;
    line-height: 1.2;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.85),
      0 1px 2px rgba(40, 52, 70, 0.12);
    transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
    cursor: pointer;
  }


  .button-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 6px;
    font-size: 0.95em;
    line-height: 1;
  }

  .toolbar button:hover:enabled {
    background: linear-gradient(180deg, #ffffff 0%, #e6ecf5 100%);
    border-color: #aeb8cb;
  }

  .toolbar button:active:enabled {
    transform: translateY(1px);
    background: linear-gradient(180deg, #e5ebf5 0%, #f8faff 100%);
  }

  .toolbar button[aria-label] {
    min-width: 40px;
    padding-left: 10px;
    padding-right: 10px;
  }

  .toolbar button[aria-label] .button-icon {
    margin-right: 0;
    font-size: 1.1rem;
  }

  .tabs {
    display: flex;
    gap: 6px;
    padding: 8px 10px 0;
    flex-wrap: wrap;
    background: #edf1f7;
    border-bottom: 1px solid rgba(189, 198, 213, 0.55);
  }

  .tab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px 8px 10px;
    border: 1px solid #ccd3e1;
    border-bottom: 0;
    border-radius: 10px 10px 0 0;
    background: linear-gradient(180deg, #edf1f7 0%, #dde4ee 100%);
    color: #4d5665;
    cursor: pointer;
    max-width: 280px;
    text-align: left;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
  }

  .tab:hover {
    background: linear-gradient(180deg, #f7faff 0%, #e8edf6 100%);
  }

  .tab.active {
    background: linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%);
    border-color: #bcc8dc;
    color: #1e2633;
    box-shadow:
      0 -1px 0 rgba(255, 255, 255, 0.85),
      inset 0 2px 0 rgba(84, 115, 171, 0.18);
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
    font-size: 1rem;
    opacity: 0.75;
    cursor: pointer;
  }

  .tab-close:hover {
    background: rgba(43, 58, 84, 0.12);
    opacity: 1;
    font-weight: bolder;
    font-size: larger;
  }

  .tab-title {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }


  .tab-new {
    border: 1px solid #bcc8dc;
    border-bottom: 0;
    border-radius: 10px 10px 0 0;
    margin-left: 4px;
    width: 28px;
    height: 30px;
    background: linear-gradient(180deg, #edf1f7 0%, #dde4ee 100%);
    color: #4f5868;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    cursor: pointer;
  }

  .tab-new:hover {
    background: linear-gradient(180deg, #ffffff 0%, #e8eef8 100%);
    color: #1f2632;
  }

  .sidebyside {
    display: flex;
    gap: 8px;
    flex: 1;
    padding: 10px;
    min-height: 0;
    background: rgba(238, 242, 248, 0.76);
  }

  .editor {
    text-align: left;
    flex: 1;
    border: 1px solid #c5cfdf;
    border-radius: 12px;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
  }

  .output {
    text-align: left;
    flex: 1;
    min-width: 0;
    min-height: 0;
    border: 1px solid #c5cfdf;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
  }

  .diff-only {
    flex: 1 1 100%;
  }

  .diff-shell {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .diff-funnel {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    width: 28px;
    height: calc(100% - 20px);
    pointer-events: none;
    border-radius: 999px;
    border: 1px solid rgba(130, 158, 201, 0.45);
    background: linear-gradient(180deg, rgba(95, 133, 193, 0.2), rgba(95, 133, 193, 0.08));
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
    display: flex;
    justify-content: center;
  }

  .diff-funnel-icon {
    margin-top: 8px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(62, 94, 151, 0.85);
    color: #f4f8ff;
    font-size: 0.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .hint {
    margin-left: auto;
    opacity: 0.72;
    font-size: 0.85rem;
    color: #4b5567;
  }

  .footer {
    border-top: 1px solid rgba(192, 202, 217, 0.8);
    background: rgba(245, 247, 252, 0.82);
  }

  .status {
    padding: 6px 10px;
    font-size: 0.85rem;
  }

  .status.info { color: #35537e; }
  .status.ok { color: #1f6b35; }
  .status.error { color: #9f2432; }
  button:disabled { opacity: 0.6; cursor: not-allowed; }

  .preferences-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(19, 27, 38, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
  }

  .preferences-dialog {
    background: var(--pref-dialog-bg);
    color: var(--pref-dialog-color);
    border: 1px solid var(--pref-border-color);
    border-radius: 12px;
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
    background: var(--pref-select-bg);
    color: var(--pref-dialog-color);
    border: 1px solid var(--pref-select-border);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 0.85rem;
    line-height: 1.2;
  }

  .preferences-dialog button {
    align-self: flex-end;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid var(--pref-select-border);
    background: var(--pref-button-bg);
    color: var(--pref-dialog-color);
    font-size: 0.85rem;
    line-height: 1.2;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    transition: background 0.2s ease, border-color 0.2s ease;
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

<div class="root platform-{appPlatform} theme-{effectiveTheme}">
  <div class="toolbar">
      <button on:click={runFormat} disabled={!supportsActions() || isProcessing || !actionEditor()}><span class="button-icon" aria-hidden="true">✨</span>{t("actionFormatApply")}</button>
      <button on:click={runValidate} disabled={!supportsActions() || isProcessing || !actionEditor()}><span class="button-icon" aria-hidden="true">✅</span>{t("actionValidate")}</button>
      <button on:click={undoActiveTab} disabled={!canUndoActive() || isProcessing || !actionEditor()} aria-label={t("actionUndo")} title={t("actionUndo")}><span class="button-icon" aria-hidden="true">↶</span></button>
      <button on:click={redoActiveTab} disabled={!canRedoActive() || isProcessing || !actionEditor()} aria-label={t("actionRedo")} title={t("actionRedo")}><span class="button-icon" aria-hidden="true">↷</span></button>
      <button on:click={clearActiveTab} disabled={!active().value || isProcessing}><span class="button-icon" aria-hidden="true">🧹</span>{t("actionClearEditor")}</button>
      <button on:click={runCompress} disabled={!outputValue || isProcessing}><span class="button-icon" aria-hidden="true">🗜</span>{t("actionCompressOutput")}</button>
      <button on:click={copyOutputToEditor} disabled={!outputValue || !actionEditor()}><span class="button-icon" aria-hidden="true">⤴</span>{t("actionOutputToEditor")}</button>
      <button on:click={copyOutputToClipboard} disabled={!outputValue || !actionEditor()}><span class="button-icon" aria-hidden="true">📋</span>{t("actionCopyOutput")}</button>
      <button on:click={compareWithClipboard} disabled={!actionEditor() || isProcessing}><span class="button-icon" aria-hidden="true">🆚</span>{t("actionCompareClipboard")}</button>
      <div class="hint">{t("dragAndDropHint")}</div>
    </div>

    <div class="tabs" role="tablist" aria-label={t("openedFiles")}>
      {#each tabs as tab (tab.id)}
        <div
          class="tab {tab.id === activeId ? 'active' : ''}"
          title={tab.kind === "editor" ? tab.path ?? "" : ""}
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
            <span aria-hidden="true">✕</span>
          </button>
          <span class="tab-title">{tab.title}{tab.kind === "editor" && tab.dirty ? " *" : ""}</span>
        </div>
      {/each}
      <button
        class="tab-new"
        type="button"
        on:click={createTabRightOfActive}
        aria-label={t("newTabAria")}
        title={t("newTabTitle")}
      >
        <span aria-hidden="true">＋</span>
      </button>
    </div>

    {#if active().kind === "diff"}
      <div class="sidebyside">
        <div
          class="editor diff-only"
          role="region"
          aria-label={t("editorRegionLabel")}
        >
          <div class="diff-shell">
            <div class="diff-funnel" aria-hidden="true">
              <span class="diff-funnel-icon">⏷</span>
            </div>
            {#key activeId}
              <MonacoEditor
                mode="diff"
                value={active().value}
                originalValue={(active() as DiffTab).originalValue}
                language={active().lang}
                readonly={false}
                onChange={setActiveDiffValue}
              />
            {/key}
          </div>
        </div>
      </div>
    {:else}
      <div class="sidebyside">
        <div
          class="editor"
          role="region"
          aria-label={t("editorRegionLabel")}
        >
          {#key activeId}
            <MonacoEditor
              value={active().value}
              language={active().lang}
              errorPosition={errorPosition}
              onChange={setActiveValue}
              onDropFile={handleLocalFileDrop}
            />
          {/key}
        </div>
        <div class="output">
          {#key `${activeId}-output`}
            <MonacoEditor
              value={outputValue}
              language={activeEditor()?.lang ?? sourceEditorForDiff()?.lang ?? active().lang}
              readonly={true}
            />
          {/key}
        </div>
      </div>
    {/if}
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
      <label for="theme-select">{t("themeLabel")}</label>
      <select
        id="theme-select"
        value={themePreference}
        on:change={(event) => setThemePreference((event.currentTarget as HTMLSelectElement).value as ThemePreference)}
      >
        <option value="system">{t("themeOptionSystem")}</option>
        <option value="light">{t("themeOptionLight")}</option>
        <option value="dark">{t("themeOptionDark")}</option>
      </select>
      <button type="button" on:click={() => (preferencesOpen = false)}><span class="button-icon" aria-hidden="true">✕</span>{t("close")}</button>
    </div>
  </div>
{/if}
