package main

import (
	"bytes"
	"context"
	"encoding/json"
	"encoding/xml"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx    context.Context
	logger *AppLogger
}

func NewApp(logger *AppLogger) *App { return &App{logger: logger} }

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.logger.Infof("Application started")
}

type OpenFileResult struct {
	Path     string `json:"path"`
	Filename string `json:"filename"`
	Type     string `json:"type"` // "json" | "xml" | "text"
	Content  string `json:"content"`
}

type ProcessResult struct {
	Ok      bool   `json:"ok"`
	Message string `json:"message"`
	Output  string `json:"output,omitempty"`
	Line    int    `json:"line,omitempty"`
	Column  int    `json:"column,omitempty"`
}

func (a *App) OpenFileDialogAndRead() (*OpenFileResult, error) {
	a.logger.Debugf("OpenFileDialogAndRead aufgerufen")

	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Open file",
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON/XML files", Pattern: "*.json;*.xml"},
			{DisplayName: "All files", Pattern: "*"},
		},
	})
	if err != nil {
		a.logger.Errorf("Öffnen-Dialog fehlgeschlagen: %v", err)
		return nil, err
	}

	if path == "" {
		a.logger.Infof("Öffnen-Dialog abgebrochen")
		return nil, nil
	}
	a.logger.Infof("Datei im Dialog ausgewählt: %s", path)

	return a.OpenFile(path)
}

func (a *App) SaveFile(path string, content string) (string, error) {
	a.logger.Debugf("SaveFile aufgerufen: path=%q", path)

	if strings.TrimSpace(path) == "" {
		a.logger.Infof("SaveFile übersprungen: leerer Pfad")
		return "", nil
	}

	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		a.logger.Errorf("Datei konnte nicht gespeichert werden (%s): %v", path, err)
		return "", err
	}
	a.logger.Infof("Datei gespeichert: %s", path)

	return path, nil
}

func (a *App) SaveFileAs(suggestedFilename string, content string) (string, error) {
	a.logger.Debugf("SaveFileAs aufgerufen: suggestedFilename=%q", suggestedFilename)

	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save file as",
		DefaultFilename: defaultFilename(suggestedFilename),
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON/XML files", Pattern: "*.json;*.xml"},
			{DisplayName: "All files", Pattern: "*"},
		},
	})
	if err != nil {
		a.logger.Errorf("Speichern-unter-Dialog fehlgeschlagen: %v", err)
		return "", err
	}

	if path == "" {
		a.logger.Infof("Speichern-unter-Dialog abgebrochen")
		return "", nil
	}
	a.logger.Infof("Zielpfad für Save As gewählt: %s", path)

	return a.SaveFile(path, content)
}

func (a *App) ShowAboutDialog() {
	a.logger.Debugf("ShowAboutDialog aufgerufen")
	_, _ = runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Type:    runtime.InfoDialog,
		Title:   "About DataQuickForm",
		Message: "DataQuickForm\nA fast JSON/XML editor with formatting and validation.",
	})
}

func (a *App) ShowPreferencesDialog() {
	a.logger.Debugf("ShowPreferencesDialog aufgerufen")
	_, _ = runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Type:    runtime.InfoDialog,
		Title:   "Settings",
		Message: "Settings are now available in the app preferences panel.",
	})
}

func defaultFilename(name string) string {
	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		return "untitled.json"
	}

	return filepath.Base(trimmed)
}

func (a *App) OpenFile(path string) (*OpenFileResult, error) {
	a.logger.Debugf("OpenFile aufgerufen: path=%q", path)

	b, err := os.ReadFile(path)
	if err != nil {
		a.logger.Errorf("Datei konnte nicht gelesen werden (%s): %v", path, err)
		return nil, err
	}

	ext := strings.ToLower(filepath.Ext(path))
	t := "text"
	switch ext {
	case ".json":
		t = "json"
	case ".xml":
		t = "xml"
	}

	result := &OpenFileResult{
		Path:     path,
		Filename: filepath.Base(path),
		Type:     t,
		Content:  string(b),
	}
	a.logger.Infof("Datei gelesen: %s (type=%s)", path, t)

	return result, nil
}

func (a *App) ValidateContent(content string, fileType string) (*ProcessResult, error) {
	a.logger.Debugf("ValidateContent aufgerufen: fileType=%q", fileType)

	switch strings.ToLower(fileType) {
	case "json":
		if err := validateJSON(content); err != nil {
			line, column := jsonErrorPosition(content, err)
			a.logger.Errorf("JSON-Validierung fehlgeschlagen (line=%d, col=%d): %v", line, column, err)
			return &ProcessResult{Ok: false, Message: err.Error(), Line: line, Column: column}, nil
		}
		a.logger.Infof("JSON-Validierung erfolgreich")
		return &ProcessResult{Ok: true, Message: "JSON is valid."}, nil
	case "xml":
		if err := validateXML(content); err != nil {
			line, column := xmlErrorPosition(err)
			a.logger.Errorf("XML-Validierung fehlgeschlagen (line=%d, col=%d): %v", line, column, err)
			return &ProcessResult{Ok: false, Message: err.Error(), Line: line, Column: column}, nil
		}
		a.logger.Infof("XML-Validierung erfolgreich")
		return &ProcessResult{Ok: true, Message: "XML is well-formed."}, nil
	default:
		a.logger.Errorf("Unbekannter Dateityp bei Validierung: %q", fileType)
		return &ProcessResult{Ok: false, Message: "Validation is only supported for JSON/XML."}, nil
	}
}

func (a *App) FormatContent(content string, fileType string) (*ProcessResult, error) {
	a.logger.Debugf("FormatContent aufgerufen: fileType=%q", fileType)

	switch strings.ToLower(fileType) {
	case "json":
		formatted, err := formatJSON(content)
		if err != nil {
			line, column := jsonErrorPosition(content, err)
			a.logger.Errorf("JSON-Formatierung fehlgeschlagen (line=%d, col=%d): %v", line, column, err)
			return &ProcessResult{Ok: false, Message: err.Error(), Line: line, Column: column}, nil
		}
		a.logger.Infof("JSON-Formatierung erfolgreich")
		return &ProcessResult{Ok: true, Message: "JSON formatted.", Output: formatted}, nil
	case "xml":
		formatted, err := formatXML(content)
		if err != nil {
			line, column := xmlErrorPosition(err)
			a.logger.Errorf("XML-Formatierung fehlgeschlagen (line=%d, col=%d): %v", line, column, err)
			return &ProcessResult{Ok: false, Message: err.Error(), Line: line, Column: column}, nil
		}
		a.logger.Infof("XML-Formatierung erfolgreich")
		return &ProcessResult{Ok: true, Message: "XML formatted.", Output: formatted}, nil
	default:
		a.logger.Errorf("Unbekannter Dateityp bei Formatierung: %q", fileType)
		return &ProcessResult{Ok: false, Message: "Formatting is only supported for JSON/XML."}, nil
	}
}

func validateJSON(content string) error {
	var data any
	return json.Unmarshal([]byte(content), &data)
}

func formatJSON(content string) (string, error) {
	var out bytes.Buffer
	if err := json.Indent(&out, []byte(content), "", "  "); err != nil {
		return "", err
	}
	return out.String(), nil
}

func validateXML(content string) error {
	decoder := xml.NewDecoder(strings.NewReader(content))
	for {
		if _, err := decoder.Token(); err != nil {
			if err == io.EOF {
				return nil
			}
			return err
		}
	}
}

func formatXML(content string) (string, error) {
	decoder := xml.NewDecoder(strings.NewReader(content))
	var out bytes.Buffer
	encoder := xml.NewEncoder(&out)
	encoder.Indent("", "  ")

	for {
		tok, err := decoder.Token()
		if err != nil {
			if err == io.EOF {
				break
			}
			return "", err
		}

		if charData, ok := tok.(xml.CharData); ok {
			if len(bytes.TrimSpace(charData)) == 0 {
				continue
			}
		}

		if err := encoder.EncodeToken(tok); err != nil {
			return "", err
		}
	}

	if err := encoder.Flush(); err != nil {
		return "", err
	}

	return out.String(), nil
}

func jsonErrorPosition(content string, err error) (int, int) {
	var offset int64

	switch e := err.(type) {
	case *json.SyntaxError:
		offset = e.Offset
	case *json.UnmarshalTypeError:
		offset = e.Offset
	default:
		return 0, 0
	}

	return offsetToLineColumn(content, offset)
}

func xmlErrorPosition(err error) (int, int) {
	if syntaxErr, ok := err.(*xml.SyntaxError); ok {
		return syntaxErr.Line, 1
	}

	msg := err.Error()
	idx := strings.Index(msg, "line ")
	if idx == -1 {
		return 0, 0
	}

	rest := msg[idx+len("line "):]
	n := 0
	for n < len(rest) && rest[n] >= '0' && rest[n] <= '9' {
		n++
	}
	if n == 0 {
		return 0, 0
	}

	line, parseErr := strconv.Atoi(rest[:n])
	if parseErr != nil {
		return 0, 0
	}

	return line, 1
}

func offsetToLineColumn(content string, offset int64) (int, int) {
	if offset <= 0 {
		return 0, 0
	}

	limit := int(offset)
	if limit > len(content) {
		limit = len(content)
	}

	line := 1
	column := 1
	for i := 0; i < limit-1; i++ {
		if content[i] == '\n' {
			line++
			column = 1
		} else {
			column++
		}
	}

	return line, column
}
