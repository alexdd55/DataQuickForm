# JsonXmEditor

JsonXmEditor is a desktop editor for **JSON** and **XML**, built with **Wails (Go + Svelte + Monaco Editor)**.
It supports loading, editing, validating, formatting, and saving structured files.

## Features

- Open JSON/XML files (file dialog + drag and drop)
- Edit multiple files in parallel using tabs
- Validate JSON and XML with error feedback
- Format JSON and XML (pretty print)
- Output panel actions (for example: compress, copy, apply back to editor)
- App menu with New/Open/Save/Save As, Settings, and About dialog
- Multilingual UI (including German, English, Spanish, Portuguese, and French)

## Tech Stack

- **Backend:** Go
- **Desktop Framework:** Wails v2
- **Frontend:** Svelte + TypeScript + Vite
- **Editor:** Monaco Editor
- **Important:** Core JSON/XML processing uses Go standard library only (`encoding/json`, `encoding/xml`).

## Project Structure (Overview)

- `main.go` – app startup, Wails initialization, and application menu
- `app.go` – file operations plus JSON/XML validation and formatting
- `logging.go` – application and crash logging
- `frontend/src/App.svelte` – main UI with editor, tabs, and actions
- `docs/` – technical notes and planning docs

## Requirements

- Go (compatible with the setup defined in `go.mod`)
- Node.js + npm
- Wails CLI

## Run in Development

```bash
# 1) Install frontend dependencies
cd frontend
npm install
cd ..

# 2) Start the app in development mode
wails dev
```

## Build

### Local Build

```bash
wails build
```

### Linux Build via Docker (amd64)

```bash
./build_linux.sh
```

## Quality Checks

### Frontend lint/type checks

```bash
cd frontend
npm run check
```

### Backend tests

```bash
go test ./...
```


### UI screenshot artifact (for UI review)

When validating visual changes in a Codex/browser-tools session, prefer the MCP browser tool screenshot flow.
If Chromium fails in the container, retry with Firefox/WebKit in the same tool session as a fallback.

## Logging

By default, the application writes logs to:

- `~/.JsonXmlEditor_logs/application.log`
- `~/.JsonXmlEditor_logs/crash.log`

## License

This project is licensed under the terms in `LICENSE`.
