export function getActiveTab(tabs, activeId) {
    return tabs.find((tab) => tab.id === activeId) ?? tabs[0];
}
export function getActiveEditorTab(tabs, activeId) {
    const tab = getActiveTab(tabs, activeId);
    return tab.kind === "editor" ? tab : null;
}
export function getSourceEditorTabForDiff(tabs, activeId) {
    const tab = getActiveTab(tabs, activeId);
    if (tab.kind !== "diff") {
        return null;
    }
    const sourceTab = tabs.find((candidate) => candidate.id === tab.sourceEditorId);
    return sourceTab && sourceTab.kind === "editor" ? sourceTab : null;
}
export function getActionEditorTab(tabs, activeId) {
    return getActiveEditorTab(tabs, activeId) ?? getSourceEditorTabForDiff(tabs, activeId);
}
