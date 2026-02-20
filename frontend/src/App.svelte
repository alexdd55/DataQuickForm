<script lang="ts">
  import { onMount } from "svelte";
  import "./App.css";
  import MonacoEditor from "./lib/MonacoEditor.svelte";
  import { getActionEditorTab, getActiveEditorTab, getActiveTab } from "./lib/tabState";
  import { getToolbarDisabledState } from "./lib/toolbarState";
  import {
    LOCALE_STORAGE_KEY,
    THEME_STORAGE_KEY,
    detectInitialLocale,
    detectInitialThemePreference,
    detectSystemTheme,
    localeNames,
    translations,
    type Locale,
    type ResolvedTheme,
    type ThemePreference,
    type TranslationKey
  } from "./lib/appI18n";
  import {
    compressJsonContent,
    compressXmlContent,
    detectPlatform,
    getBaseName,
    guessLang,
    guessLangFromFilename,
    makeId,
    type AppPlatform
  } from "./lib/appUtils";
  import type { EditorTab, Tab } from "./lib/tabState";
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
  let toolbarDisabled = getToolbarDisabledState({ tabs, activeId, isProcessing, outputValue });
  let comparePopupOpen = false;
  let comparePopupTitle = "";
  let comparePopupOriginal = "";
  let comparePopupClipboard = "";
  let comparePopupLanguage: Tab["lang"] = "json";
  let comparePopupKey = 0;

  const active = () => getActiveTab(tabs, activeId);
  const activeEditor = (): EditorTab | null => getActiveEditorTab(tabs, activeId);
  const actionEditor = (): EditorTab | null => getActionEditorTab(tabs, activeId);
  $: toolbarDisabled = getToolbarDisabledState({ tabs, activeId, isProcessing, outputValue });


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

  function clearActionEditorTab() {
    const tab = activeEditor();
    if (!tab || !tab.value) {
      return;
    }

    setEditorValue(tab.id, "");
    outputValue = "";
    errorPosition = null;
    comparePopupOpen = false;
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

      comparePopupTitle = t("comparePopupTitle", { name: tab.title });
      comparePopupOriginal = tab.value;
      comparePopupClipboard = clipboardValue;
      comparePopupLanguage = tab.lang;
      comparePopupKey += 1;
      comparePopupOpen = true;
      outputValue = tab.value;
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
        EventsOn("menu:format", runFormat);
        EventsOn("menu:validate", runValidate);
        EventsOn("menu:clear", clearActionEditorTab);
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


<div class="root platform-{appPlatform} theme-{effectiveTheme}">
  <div class="toolbar">
      <button on:click={runFormat} disabled={toolbarDisabled.format}><span class="button-icon" aria-hidden="true">✨</span>{t("actionFormatApply")}</button>
      <button on:click={runValidate} disabled={toolbarDisabled.validate}><span class="button-icon" aria-hidden="true">✅</span>{t("actionValidate")}</button>
      <button on:click={undoActiveTab} disabled={toolbarDisabled.undo} aria-label={t("actionUndo")} title={t("actionUndo")}><span class="button-icon" aria-hidden="true">↶</span></button>
      <button on:click={redoActiveTab} disabled={toolbarDisabled.redo} aria-label={t("actionRedo")} title={t("actionRedo")}><span class="button-icon" aria-hidden="true">↷</span></button>
      <button on:click={clearActionEditorTab} disabled={toolbarDisabled.clear}><span class="button-icon" aria-hidden="true">🧹</span>{t("actionClearEditor")}</button>
      <button on:click={runCompress} disabled={toolbarDisabled.compress}><span class="button-icon" aria-hidden="true">🗜</span>{t("actionCompressOutput")}</button>
      <button on:click={copyOutputToEditor} disabled={toolbarDisabled.outputToEditor}><span class="button-icon" aria-hidden="true">⤴</span>{t("actionOutputToEditor")}</button>
      <button on:click={copyOutputToClipboard} disabled={toolbarDisabled.copyOutput}><span class="button-icon" aria-hidden="true">📋</span>{t("actionCopyOutput")}</button>
      <button on:click={compareWithClipboard} disabled={toolbarDisabled.compareClipboard}><span class="button-icon" aria-hidden="true">🆚</span>{t("actionCompareClipboard")}</button>
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
        {#key `output-${activeId}`}
          <MonacoEditor
            value={outputValue}
            language={activeEditor()?.lang ?? active().lang}
            readonly={true}
          />
        {/key}
      </div>
    </div>
    <div class="footer">
      <div class="status {status.kind}">{status.message}</div>
    </div>
</div>

{#if comparePopupOpen}
  <div class="compare-backdrop">
    <div class="compare-dialog" role="dialog" tabindex="-1" aria-modal="true" aria-label={comparePopupTitle}>
      <div class="compare-header">
        <h2>{comparePopupTitle}</h2>
        <button class="compare-close" type="button" on:click={() => (comparePopupOpen = false)}><span class="button-icon" aria-hidden="true">✕</span>{t("close")}</button>
      </div>
      <div class="compare-body">
        <div class="diff-shell">
          <div class="diff-funnel" aria-hidden="true">
            <span class="diff-funnel-icon">⏷</span>
          </div>
          {#key comparePopupKey}
            <MonacoEditor
              mode="diff"
              originalValue={comparePopupOriginal}
              value={comparePopupClipboard}
              language={comparePopupLanguage}
              readonly={true}
              originalEditable={true}
            />
          {/key}
        </div>
      </div>
    </div>
  </div>
{/if}

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
