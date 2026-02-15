package main

import (
	"embed"
	"fmt"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var assets embed.FS

func main() {
	logger, err := newAppLogger()
	if err != nil {
		msg := fmt.Sprintf("Logger-Initialisierung fehlgeschlagen: %v", err)
		_, _ = fmt.Fprintln(os.Stderr, msg)
		writeBootstrapCrashLog(msg)
		os.Exit(1)
	}
	defer logger.Close()

	defer func() {
		if recovered := recover(); recovered != nil {
			logger.LogCrash(recovered)
			logger.Close()
			os.Exit(1)
		}
	}()

	app := NewApp(logger)
	appMenu := buildApplicationMenu(app)
	logger.Infof("Wails-Anwendung wird gestartet")

	err = wails.Run(&options.App{
		Title:  "DataQuickForm",
		Width:  1200,
		Height: 800,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup: app.startup,
		Bind: []interface{}{
			app,
		},
		Menu: appMenu,
		DragAndDrop: &options.DragAndDrop{
			EnableFileDrop:     true,
			DisableWebViewDrop: true,
		},
	})
	if err != nil {
		logger.Errorf("Wails-Run fehlgeschlagen: %v", err)
		logger.LogCrashError(err)
		logger.Close()
		os.Exit(1)
	}
}

func buildApplicationMenu(app *App) *menu.Menu {
	root := menu.NewMenu()

	fileMenu := root.AddSubmenu("Datei")
	fileMenu.AddText("Neu", keys.CmdOrCtrl("n"), func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:new")
	})
	fileMenu.AddText("Öffnen...", keys.CmdOrCtrl("o"), func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:open")
	})
	fileMenu.AddText("Speichern", keys.CmdOrCtrl("s"), func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:save")
	})
	fileMenu.AddText("Speichern unter...", keys.Combo("s", keys.CmdOrCtrlKey, keys.ShiftKey), func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:saveas")
	})
	fileMenu.AddSeparator()
	fileMenu.AddText("Beenden", keys.CmdOrCtrl("q"), func(_ *menu.CallbackData) {
		runtime.Quit(app.ctx)
	})

	editMenu := root.AddSubmenu("Bearbeiten")
	editMenu.AddText("Einstellungen", keys.CmdOrCtrl(","), func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:preferences")
	})

	helpMenu := root.AddSubmenu("Hilfe")
	helpMenu.AddText("Über", nil, func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:about")
	})

	return root
}
