import { getActionEditorTab } from "./tabState.js";
export function getToolbarDisabledState({ tabs, activeId, isProcessing, outputValue }) {
    const actionEditor = getActionEditorTab(tabs, activeId);
    const hasActionEditor = !!actionEditor;
    const supportsStructuredActions = !!actionEditor && (actionEditor.lang === "json" || actionEditor.lang === "xml");
    const hasUndo = !!actionEditor && actionEditor.undoHistory.length > 0;
    const hasRedo = !!actionEditor && actionEditor.redoHistory.length > 0;
    const hasEditorValue = !!actionEditor?.value;
    const hasOutput = !!outputValue;
    return {
        format: !supportsStructuredActions || isProcessing || !hasActionEditor,
        validate: !supportsStructuredActions || isProcessing || !hasActionEditor,
        undo: !hasUndo || isProcessing || !hasActionEditor,
        redo: !hasRedo || isProcessing || !hasActionEditor,
        clear: !hasEditorValue || isProcessing,
        compress: !hasOutput || isProcessing,
        outputToEditor: !hasOutput || !hasActionEditor,
        copyOutput: !hasOutput || !hasActionEditor,
        compareClipboard: !hasActionEditor || isProcessing
    };
}
