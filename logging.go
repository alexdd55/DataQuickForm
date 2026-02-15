package main

import (
	"fmt"
	"io"
	"os"
	"os/user"
	"path/filepath"
	"runtime/debug"
	"strings"
	"sync"
	"time"
)

type AppLogger struct {
	mu        sync.Mutex
	writer    io.Writer
	logFile   *os.File
	crashFile *os.File
}

func newAppLogger() (*AppLogger, error) {
	home, err := resolveHomeDir()
	if err != nil {
		return nil, fmt.Errorf("home directory konnte nicht bestimmt werden: %w", err)
	}

	logDir := filepath.Join(home, ".dataquickformlog")
	if err := os.MkdirAll(logDir, 0o755); err != nil {
		return nil, fmt.Errorf("log-verzeichnis konnte nicht erstellt werden: %w", err)
	}

	appLogPath := filepath.Join(logDir, "application.log")
	crashLogPath := filepath.Join(logDir, "crash.log")

	appLog, err := os.OpenFile(appLogPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return nil, fmt.Errorf("application-log konnte nicht geöffnet werden: %w", err)
	}

	crashLog, err := os.OpenFile(crashLogPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		_ = appLog.Close()
		return nil, fmt.Errorf("crash-log konnte nicht geöffnet werden: %w", err)
	}

	return &AppLogger{
		writer:    io.MultiWriter(os.Stderr, appLog),
		logFile:   appLog,
		crashFile: crashLog,
	}, nil
}

func resolveHomeDir() (string, error) {
	if home, err := os.UserHomeDir(); err == nil && strings.TrimSpace(home) != "" {
		return home, nil
	}

	if u, err := user.Current(); err == nil && strings.TrimSpace(u.HomeDir) != "" {
		return u.HomeDir, nil
	}

	if home := strings.TrimSpace(os.Getenv("HOME")); home != "" {
		return home, nil
	}

	if home := strings.TrimSpace(os.Getenv("USERPROFILE")); home != "" {
		return home, nil
	}

	return "", fmt.Errorf("kein Home-Verzeichnis gefunden")
}

func writeBootstrapCrashLog(message string) {
	home, err := resolveHomeDir()
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "%s [CRASH] %s (zusätzlich konnte kein Home-Verzeichnis bestimmt werden: %v)\n", time.Now().Format(time.RFC3339), message, err)
		return
	}

	logDir := filepath.Join(home, ".dataquickformlog")
	if err := os.MkdirAll(logDir, 0o755); err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "%s [CRASH] %s (zusätzlich konnte das Log-Verzeichnis nicht erstellt werden: %v)\n", time.Now().Format(time.RFC3339), message, err)
		return
	}

	path := filepath.Join(logDir, "crash.log")
	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "%s [CRASH] %s (zusätzlich konnte crash.log nicht geöffnet werden: %v)\n", time.Now().Format(time.RFC3339), message, err)
		return
	}
	defer func() { _ = f.Close() }()

	_, _ = fmt.Fprintf(f, "%s [CRASH] %s\n", time.Now().Format(time.RFC3339), message)
}

func (l *AppLogger) Close() {
	if l == nil {
		return
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	if l.logFile != nil {
		_ = l.logFile.Close()
		l.logFile = nil
	}
	if l.crashFile != nil {
		_ = l.crashFile.Close()
		l.crashFile = nil
	}
}

func (l *AppLogger) Debugf(format string, args ...any) {
	l.write("DEBUG", format, args...)
}

func (l *AppLogger) Infof(format string, args ...any) {
	l.write("INFO", format, args...)
}

func (l *AppLogger) Errorf(format string, args ...any) {
	l.write("ERROR", format, args...)
}

func (l *AppLogger) LogCrash(recovered any) {
	if l == nil {
		return
	}

	entry := fmt.Sprintf("recovered panic: %v", recovered)
	l.writeCrashEntry(entry, string(debug.Stack()))
}

func (l *AppLogger) LogCrashError(err error) {
	if l == nil || err == nil {
		return
	}

	l.writeCrashEntry(fmt.Sprintf("fatal error: %v", err), "")
}

func (l *AppLogger) writeCrashEntry(message string, stack string) {
	timestamp := time.Now().Format(time.RFC3339)
	crashEntry := fmt.Sprintf("%s [CRASH] %s\n", timestamp, message)
	if stack != "" {
		crashEntry += stack + "\n"
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	if l.writer != nil {
		_, _ = io.WriteString(l.writer, crashEntry)
	}
	if l.crashFile != nil {
		_, _ = io.WriteString(l.crashFile, crashEntry)
	}
}

func (l *AppLogger) write(level string, format string, args ...any) {
	if l == nil {
		return
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	if l.writer == nil {
		return
	}

	message := fmt.Sprintf(format, args...)
	line := fmt.Sprintf("%s [%s] %s\n", time.Now().Format(time.RFC3339), level, message)
	_, _ = io.WriteString(l.writer, line)
}
