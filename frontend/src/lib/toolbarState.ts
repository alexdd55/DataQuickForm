import { getActionEditorTab, type Tab } from "./tabState.js";

type ToolbarStateInput = {
  tabs: Tab[];
  activeId: string;
  isProcessing: boolean;
  outputValue: string;
};

export type ToolbarDisabledState = {
  format: boolean;
  validate: boolean;
  undo: boolean;
  redo: boolean;
  clear: boolean;
  compress: boolean;
  outputToEditor: boolean;
  copyOutput: boolean;
  compareClipboard: boolean;
};

export function getToolbarDisabledState({
  tabs,
  activeId,
  isProcessing,
  outputValue
}: ToolbarStateInput): ToolbarDisabledState {
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
