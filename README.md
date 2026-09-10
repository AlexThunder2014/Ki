# AI Builder V2

Persönliche KI-Builder-Oberfläche für GitHub Pages.

## Enthalten

- Chat
- Auto-Modus
- Code-Modus
- Bild-Modus
- 3D-Modus
- Plan-Modus
- Projektdateien
- Code-Editor
- lokaler Speicher
- Projekt-Builder
- Bauplan-Generator
- Bild-Prompt-Generator
- Three.js-3D-Vorschau
- Dark Mode
- Light Mode
- optionales KI-Backend

## Wichtig

Der Demo-Modus ist keine echte große KI.

Er stellt die Oberfläche und die
Grundfunktionen des AI Builders bereit.

Für echte KI-Antworten muss ein
sicheres Backend mit einem KI-Modell
verbunden werden.

API-Schlüssel niemals direkt in
GitHub-Pages-JavaScript speichern.

## Backend

Der AI Builder sendet bei einem
verbundenen Backend eine POST-Anfrage.

Beispiel:

{
  "message": "...",
  "files": {
    "index.html": "..."
  },
  "projectName": "...",
  "mode": "code"
}

Das Backend kann beispielsweise
antworten mit:

{
  "reply": "...",
  "files": {
    "index.html": "..."
  }
}

## Export

Der Export in V2 erzeugt momentan
ein Text-Bundle mit allen Projektdateien.

Eine echte ZIP-Projektdatei kann
in einer späteren Version ergänzt werden.

## Three.js

Die 3D-Vorschau verwendet Three.js
über jsDelivr.

Dafür benötigt die Webseite
eine Internetverbindung.
