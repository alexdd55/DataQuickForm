# DataQuickForm Audit (Logging & Stability)

## Umfang
- Review der Backend-Startlogik (`main.go`)
- Review des Logging-Systems (`logging.go`)
- Review der Kernpfade für Dateioperationen/Validierung (`app.go`)
- Testsituation (bestehende + neue Tests)

## Feststellungen

### 1) Crash-Logging in Exit-Pfaden
- **Risiko:** Bei `os.Exit(1)` laufen `defer`-Aufrufe nicht mehr.
- **Auswirkung:** Ressourcen werden nicht sauber geschlossen; in manchen Umgebungen können finale Write/Close-Pfade ausbleiben.
- **Maßnahme:** Vor `os.Exit(1)` wird `logger.Close()` jetzt explizit aufgerufen.

### 2) Frühe Startfehler und Home-Directory-Auflösung
- **Risiko:** Wenn Home-Auflösung fehlschlägt, können reguläre Logs nicht initialisiert werden.
- **Auswirkung:** Fehlende Diagnose bei sehr frühen Fehlern.
- **Maßnahme:** Mehrstufige Home-Auflösung und Bootstrap-Crash-Logging in `crash.log`.

### 3) Testabdeckung fürs Logging
- **Risiko:** Logging-Pfade waren funktional kaum durch Tests abgesichert.
- **Auswirkung:** Regressionen in Pfad-/Datei-/Crash-Logging bleiben unentdeckt.
- **Maßnahme:** Neue Unit-Tests für Home-Auflösung, Bootstrap-Crash-Log und reguläre Log-Ausgabe.

## Ergebnis
- Logging und Crash-Logging sind jetzt robuster in Start- und Fehlerpfaden.
- Kritische Logging-Funktionen sind durch zusätzliche Tests abgesichert.
