package main

import (
	"context"
	"os"
	"path/filepath"
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
