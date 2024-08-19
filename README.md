# PiCloud - Deine Cloud auf dem Raspberry Pi

Erstellt mit Sveltekit. Eine Anwendung, die auf einem Raspberry Pi läuft und als Cloud-Speicher dient. Greife von überall auf deine Datein zu. Vorallem für den privaten Gebrauch im lokalen Netzwerk geeignet.

## Features
- Dateien hochladen (auch per Drag & Drop)
- Dateien herunterladen (auch als ZIP)
- Dateien löschen
- Dateien umbenennen
- Durch Streams große Dateien effizient hoch- und herunterladen
- Dateien in Ordnern organisieren
- Automatisches Erstellen von Vorschaubildern für Bilder und Videos
- Selektives Herunterladen von Dateien und Ordnern
- Videos direkt im Browser streamen 

## Installation
  Eine `.env` Datei mit den Konfigurationsdaten muss im Root-Verzeichnis erstellt werden. Ein Beispiel dafür ist in der `.env.example` Datei zu finden.  
  Ändere `ROOT_DIR` in der `.env` Datei auf den Pfad, in dem die Dateien gespeichert werden sollen. Und ändere `AVAILABLE_SPACE_IN_GB` auf die verfügbare Speicherkapazität in GB (nicht bindend).

  Zudem muss [ffmpeg](https://www.ffmpeg.org/download.html) installiert sein, um Vorschaubilder für Videos zu erstellen. 

  Nachdem die `.env` Datei erstellt wurde, kann das Projekt mit folgenden Befehlen installiert und im Produktionsmodus gestartet werden:

  ```bash
  npm install
  npm run build
  node build
  ```

  Für die Entwicklung kann das Projekt mit folgenden Befehlen gestartet werden:

  ```bash
  npm install
  npm run dev
  ```

## Mögliche Erweiterungen

Steigere die Geschwindigkeit deiner lokalen Cloud, indem eine SSD per USB 3.0 an den Raspberry Pi angeschlossen wird.  
Funktioniert nicht nur auf dem Raspberry Pi, sondern auf jedem Gerät, auf dem Node.js läuft.