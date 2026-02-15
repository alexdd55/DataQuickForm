package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestResolveHomeDirUsesHOMEWhenSet(t *testing.T) {
	tempHome := t.TempDir()
	t.Setenv("HOME", tempHome)
	t.Setenv("USERPROFILE", "")

	home, err := resolveHomeDir()
	if err != nil {
		t.Fatalf("resolveHomeDir returned unexpected error: %v", err)
	}
	if home != tempHome {
		t.Fatalf("expected home %q, got %q", tempHome, home)
	}
}

func TestWriteBootstrapCrashLogCreatesFile(t *testing.T) {
	tempHome := t.TempDir()
	t.Setenv("HOME", tempHome)
	t.Setenv("USERPROFILE", "")

	msg := "bootstrap test crash"
	writeBootstrapCrashLog(msg)

	crashPath := filepath.Join(tempHome, ".dataquickformlog", "crash.log")
	content, err := os.ReadFile(crashPath)
	if err != nil {
		t.Fatalf("failed to read crash log: %v", err)
	}
	if !strings.Contains(string(content), msg) {
		t.Fatalf("expected crash log to contain %q, got: %s", msg, string(content))
	}
}

func TestNewAppLoggerWritesApplicationAndCrashLogs(t *testing.T) {
	tempHome := t.TempDir()
	t.Setenv("HOME", tempHome)
	t.Setenv("USERPROFILE", "")

	logger, err := newAppLogger()
	if err != nil {
		t.Fatalf("newAppLogger returned unexpected error: %v", err)
	}

	logger.Debugf("debug message")
	logger.Infof("info message")
	logger.Errorf("error message")
	logger.LogCrashError(os.ErrInvalid)
	logger.Close()

	appLogPath := filepath.Join(tempHome, ".dataquickformlog", "application.log")
	appContent, err := os.ReadFile(appLogPath)
	if err != nil {
		t.Fatalf("failed to read application log: %v", err)
	}
	appText := string(appContent)
	for _, part := range []string{"debug message", "info message", "error message", "fatal error"} {
		if !strings.Contains(appText, part) {
			t.Fatalf("expected application log to contain %q, got: %s", part, appText)
		}
	}

	crashLogPath := filepath.Join(tempHome, ".dataquickformlog", "crash.log")
	crashContent, err := os.ReadFile(crashLogPath)
	if err != nil {
		t.Fatalf("failed to read crash log: %v", err)
	}
	if !strings.Contains(string(crashContent), "fatal error") {
		t.Fatalf("expected crash log to contain fatal error entry, got: %s", string(crashContent))
	}
}
