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
)

type App struct {
	ctx context.Context
}

func NewApp() *App { return &App{} }

func (a *App) startup(ctx context.Context) { a.ctx = ctx }

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

func (a *App) OpenFile(path string) (*OpenFileResult, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	ext := strings.ToLower(filepath.Ext(path))
	t := "text"
	if ext == ".json" {
		t = "json"
	} else if ext == ".xml" {
		t = "xml"
	}

	return &OpenFileResult{
		Path:     path,
		Filename: filepath.Base(path),
		Type:     t,
		Content:  string(b),
	}, nil
}

func (a *App) ValidateContent(content string, fileType string) (*ProcessResult, error) {
	switch strings.ToLower(fileType) {
	case "json":
		if err := validateJSON(content); err != nil {
			line, column := jsonErrorPosition(content, err)
			return &ProcessResult{Ok: false, Message: err.Error(), Line: line, Column: column}, nil
		}
		return &ProcessResult{Ok: true, Message: "JSON ist gültig."}, nil
	case "xml":
		if err := validateXML(content); err != nil {
			line, column := xmlErrorPosition(err)
			return &ProcessResult{Ok: false, Message: err.Error(), Line: line, Column: column}, nil
		}
		return &ProcessResult{Ok: true, Message: "XML ist wohlgeformt."}, nil
	default:
		return &ProcessResult{Ok: false, Message: "Validierung wird nur für JSON/XML unterstützt."}, nil
	}
}

func (a *App) FormatContent(content string, fileType string) (*ProcessResult, error) {
	switch strings.ToLower(fileType) {
	case "json":
		formatted, err := formatJSON(content)
		if err != nil {
			line, column := jsonErrorPosition(content, err)
			return &ProcessResult{Ok: false, Message: err.Error(), Line: line, Column: column}, nil
		}
		return &ProcessResult{Ok: true, Message: "JSON wurde formatiert.", Output: formatted}, nil
	case "xml":
		formatted, err := formatXML(content)
		if err != nil {
			line, column := xmlErrorPosition(err)
			return &ProcessResult{Ok: false, Message: err.Error(), Line: line, Column: column}, nil
		}
		return &ProcessResult{Ok: true, Message: "XML wurde formatiert.", Output: formatted}, nil
	default:
		return &ProcessResult{Ok: false, Message: "Formatierung wird nur für JSON/XML unterstützt."}, nil
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
