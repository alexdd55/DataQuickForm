export const LOCALE_STORAGE_KEY = "dqf.language";
export const THEME_STORAGE_KEY = "dqf.theme";
export const localeNames = {
    en: "English",
    de: "Deutsch",
    es: "Español",
    pt: "Português",
    fr: "Français"
};
export const translations = {
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
    comparePopupTitle: {
        en: "Compare: {name} ↔ Clipboard",
        de: "Vergleich: {name} ↔ Zwischenablage",
        es: "Comparar: {name} ↔ Portapapeles",
        pt: "Comparar: {name} ↔ Área de transferência",
        fr: "Comparer : {name} ↔ Presse-papiers"
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
};
function isLocale(value) {
    return value === "en" || value === "de" || value === "es" || value === "pt" || value === "fr";
}
function isThemePreference(value) {
    return value === "system" || value === "light" || value === "dark";
}
export function detectInitialLocale() {
    if (typeof localStorage === "undefined") {
        return "en";
    }
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && isLocale(saved)) {
        return saved;
    }
    return "en";
}
export function detectInitialThemePreference() {
    if (typeof localStorage === "undefined") {
        return "system";
    }
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && isThemePreference(saved)) {
        return saved;
    }
    return "system";
}
export function detectSystemTheme() {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return "light";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
