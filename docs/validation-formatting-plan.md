# Erweiterungsplan: Validierung & Formatierung

## 1) Projekt-Check (Ist-Zustand)

- **Frontend (Svelte + Monaco):**
  - Editor mit Tabs für JSON/XML/Text vorhanden.
  - Drag & Drop lädt `.json`/`.xml` und öffnet Dateien in neuen Tabs.
  - Buttons **Format** und **Validate** sind aktuell Platzhalter (`alert`).
- **Backend (Go / Wails Bindings):**
  - `OpenFile(path)` liest Dateien ein und liefert Inhalt + Typ.
  - Keine Backend-Methoden für Validierung, Pretty-Print oder Fehlerpositionen.
- **Qualitätssicherung:**
  - Es existieren derzeit keine Unit-Tests.
  - Typecheck/Lint-ähnlicher Check (`svelte-check`) funktioniert.

## 2) Zielbild

Ohne externe Libraries sollen folgende Funktionen ergänzt werden:

1. **JSON formatieren** (einrücken, stabil speichern)
2. **JSON validieren** (inkl. menschenlesbarer Fehlermeldung)
3. **XML formatieren** (saubere Einrückung)
4. **XML validieren** (wohlgeformtes XML prüfen)
5. **UI-Feedback**: Erfolg/Fehler als Statuszeile statt `alert`

## 3) Technischer Ansatz (ohne externe Libraries)

## 3.1 Backend (Go)

Neue Wails-Methoden auf `App`:

- `FormatContent(content string, fileType string) (*ProcessResult, error)`
- `ValidateContent(content string, fileType string) (*ProcessResult, error)`

Vorgeschlagener Rückgabetyp:

```go
type ProcessResult struct {
    Ok         bool   `json:"ok"`
    Message    string `json:"message"`
    Output     string `json:"output,omitempty"`
    Line       int    `json:"line,omitempty"`
    Column     int    `json:"column,omitempty"`
    Start      int    `json:"start,omitempty"`
    End        int    `json:"end,omitempty"`
}
```

Implementierung mit Standardbibliothek:

- JSON:
  - Formatierung über `encoding/json` (`json.Indent`)
  - Validierung über `json.Unmarshal` in `interface{}`
- XML:
  - Validierung über `encoding/xml` (`xml.Decoder` durchlaufen lassen)
  - Formatierung über Tokenizing + eigener einfacher Indenter

## 3.2 Frontend (Svelte)

- Buttons an Backend-Methoden anbinden.
- Statusbereich ergänzen (z. B. `status: { kind: "ok" | "error"; message: string }`).
- Bei Fehlern Cursor-Position/Marker im Editor setzen (wenn `line/column` geliefert wird).
- Für `plaintext` Buttons deaktivieren oder Hinweis anzeigen.

## 4) Schrittplan (inkrementell)

### Phase 1 – JSON zuerst

- Backend: `ValidateContent` + `FormatContent` für JSON.
- Frontend: Format/Validate Buttons rufen JSON-Logik auf.
- Tests Go:
  - Gültiges JSON -> `ok=true`
  - Ungültiges JSON -> `ok=false` + Fehlermeldung
  - Formatierung liefert erwartete Einrückung

### Phase 2 – XML nachziehen

- Backend: XML-Validierung + XML-Formatierung mit stdlib-Tokenstream.
- Frontend: XML-Fälle aktivieren.
- Tests Go:
  - Wohlgeformtes XML -> `ok=true`
  - Fehlerhaftes XML -> `ok=false` + Position
  - Formatierung hält Struktur konsistent

### Phase 3 – UX-Härtung

- Einheitliche Status-Komponente (nicht-blockierend, kein `alert`).
- Buttons während Verarbeitung deaktivieren.
- Optional: "nur bei Änderung" Marker/Status im Tab.

## 5) Akzeptanzkriterien

- Formatieren/Validieren funktioniert für JSON und XML.
- Keine externen Libraries nötig.
- Bei Fehlern sind Meldungen verständlich und möglichst mit Position.
- `go test ./...` grün.
- `npm run check` grün.

## 6) Risiken / Hinweise

- XML-Pretty-Print ohne externe Bibliothek erfordert eigene Token-Logik.
- Monaco-Bundle ist bereits groß; neue Features sollten ohne zusätzliche Frontend-Pakete erfolgen.
- Zeilen-/Spaltenmapping von Go-Fehlern zur Editor-Position muss getestet werden.
