# Lernzeit-Manager

Der **Lernzeit-Manager** ist eine browserbasierte Anwendung zur Planung, Erfassung und Auswertung von Lernzeiten. Die App unterstützt Studierende dabei, Lernziele zu definieren, Lernzeiten strukturiert zu planen, tatsächliche Lernzeiten mit einer Stoppuhr zu messen und den eigenen Fortschritt nachvollziehbar auszuwerten.

## Funktionen

### Anmeldung

Die Anwendung enthält vorbereitete Test-Accounts für unterschiedliche Rollen. Nach der Anmeldung werden die Daten getrennt nach Account im lokalen Browser-Speicher gespeichert.

### Dashboard

Das Dashboard gibt einen schnellen Überblick über:

- geplante Lernzeit,
- bereits erfasste Lernzeit,
- Zielerreichung,
- nächsten Lernblock,
- Plan-/Ist-Fortschritt,
- aktuelle Hinweise und Erinnerungen.

### Lernziele

Im Bereich **Lernziele** können Lernziele angelegt, verwaltet und als erreicht markiert werden. Ein Lernziel enthält unter anderem Titel, Typ, Modul oder Thema, Zieldatum, geplante Stunden, Status und eine Beschreibung.

Die Anwendung ist auf einen Planungshorizont von sechs Monaten ausgelegt.

### Planung

Im Bereich **Planung** können Lernblöcke erstellt werden. Die Anwendung unterscheidet zwischen:

- **Grobplanung** für den sechsmonatigen Zeitraum,
- **Detailplanung** für den aktuellen Monat.

Für jeden Lernblock können Datum, Startzeit, Dauer, zugeordnetes Lernziel, Erinnerung und Fokus beziehungsweise Zwischenziel erfasst werden.

### Stoppuhr

Mit der Stoppuhr kann ungestörte Lernzeit gemessen werden. Eine Lernsitzung wird einem Lernziel zugeordnet und kann mit einer Notiz gespeichert werden. Gespeicherte Lernzeiten fließen automatisch in Dashboard und Auswertung ein.

### Auswertung

Die Auswertung zeigt, wie gut die geplante Lernzeit eingehalten wurde. Dargestellt werden unter anderem:

- Plan-/Ist-Vergleich,
- Anzahl der Lernziele,
- erreichte Ziele,
- erfasste Lernsitzungen,
- Fortschritt je Lernziel.

### Erinnerungen

Die App erzeugt Hinweise zu:

- bald startenden Lernblöcken,
- nahenden Zielterminen,
- ungeplanter Inaktivität.

Die Regeln für Zieltermine und Inaktivität können angepasst werden. Optional kann eine Browser-Testbenachrichtigung ausgelöst werden.

### Datenexport und Import

Im Bereich **Daten & Export** können die lokalen Daten als JSON-Datei exportiert und später wieder importiert werden. Zusätzlich kann ein Kurzbericht im Markdown-Format erzeugt werden.

## Test-Accounts

| Rolle      | Login          | Passwort        |
| ---------- | -------------- | --------------- |
| Student:in | `student.demo` | `Lernzeit2026!` |
| Tutor:in   | `tutor.demo`   | `Tutor2026!`    |
| Admin      | `admin.ms4`    | `Admin2026!`    |

## Technischer Rahmen

Die Anwendung ist als Single Page Application umgesetzt.

Verwendete Technologien:

- React
- Vite
- TypeScript
- lucide-react
- Vitest
- LocalStorage

Die Daten werden lokal im Browser gespeichert. Es gibt kein Backend und keine zentrale Datenbank.

## Lokal starten

```bash
npm install
npm run dev
```

```
Falls PowerShell npm.ps1 wegen der Ausführungsrichtlinie blockiert, können die Befehle alternativ mit npm.cmd ausgeführt werden:

npm.cmd install
npm.cmd run dev

```

Anschließend ist die Anwendung über die von Vite ausgegebene lokale Adresse erreichbar, typischerweise:

```text
http://localhost:5173
```

## Produktionsbuild erstellen

```bash
npm run build
```

Der Produktionsbuild wird im Ordner `dist/` erzeugt.

## Produktionsbuild lokal prüfen

```bash
npm run preview
```

Die lokale Vorschau ist typischerweise erreichbar unter:

```text
http://localhost:4173
```

## Tests ausführen

```bash
npm run typecheck
npm run test
```
