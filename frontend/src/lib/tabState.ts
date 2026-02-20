export type BaseTab = {
  id: string;
  title: string;
  lang: "json" | "xml" | "plaintext";
};

export type EditorTab = BaseTab & {
  kind: "editor";
  path?: string;
  value: string;
  dirty: boolean;
  undoHistory: string[];
  redoHistory: string[];
};

export type DiffTab = BaseTab & {
  kind: "diff";
  sourceEditorId: string;
  originalValue: string;
  value: string;
};

export type Tab = EditorTab | DiffTab;

export function getActiveTab(tabs: Tab[], activeId: string): Tab {
  return tabs.find((tab) => tab.id === activeId) ?? tabs[0];
}

export function getActiveEditorTab(tabs: Tab[], activeId: string): EditorTab | null {
  const tab = getActiveTab(tabs, activeId);
  return tab.kind === "editor" ? tab : null;
}

export function getSourceEditorTabForDiff(tabs: Tab[], activeId: string): EditorTab | null {
  const tab = getActiveTab(tabs, activeId);
  if (tab.kind !== "diff") {
    return null;
  }

  const sourceTab = tabs.find((candidate) => candidate.id === tab.sourceEditorId);
  return sourceTab && sourceTab.kind === "editor" ? sourceTab : null;
}


export function getActionEditorTab(tabs: Tab[], activeId: string): EditorTab | null {
  return getActiveEditorTab(tabs, activeId) ?? getSourceEditorTabForDiff(tabs, activeId);
}
