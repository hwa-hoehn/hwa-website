# Gasthof Grünlinger – Übergabe für die Weiterarbeit

Fiktiver Gasthof (Demo von HWA), Ort: fiktives Lindenreuth im Fichtelgebirge (gleicher Ort wie die Schreinerei-Demo).
Stand: Branch `claude/quirky-heisenberg-8ppght`, noch nicht live. `main` (live) enthält die Gasthof-Demo noch nicht.

## Aufbau
Statische Seiten, gemeinsames `style.css` und `script.js`, keine Build-Tools:
`index.html` (Start), `speisekarte.html`, `reservieren.html`, `zimmer.html`, `feiern.html`, `termine.html`, `gutscheine.html`, `kontakt.html`.
Header und Footer stehen in jeder Datei identisch und müssen bei Änderungen überall angepasst werden.

## Funktionen (alle im Browser getestet)
- Live-Öffnungsstatus nach deutscher Zeit (Ruhetage Mo/Di, Betriebsurlaub 7.–20.1., Kirchweihmontag geöffnet)
- Tageskarte als Schiefertafel, wählt den heutigen Tag
- Speisekarte mit Kategorien, Filtern (vegetarisch, ohne Gluten), Allergenen, Druckansicht
- Reservierung mit Kalender, simulierter Auslastung, .ics-Download; `reservieren.html?datum=JJJJ-MM-TT` wählt ein Datum vor
- Zimmer-Preisrechner, Raumfinder für Feiern; beide füllen `kontakt.html?thema=…&nachricht=…` vor
- Termine werden aus dem aktuellen Datum berechnet (Startseite zeigt 3, Terminseite 8)
- Gutschein-Generator mit Live-Vorschau und Druck (als „Muster, nicht einlösbar“ gekennzeichnet)
- Alle Daten (Öffnungszeiten, Tageskarte, Zimmerpreise) stehen oben in `script.js`

## Gestaltung, aktueller Stand
- Farben „Weinrot & Leinen“: Weinrot #5A1E29, Messing #B08D57, Leinenweiß #F8F6F2, Rauchbraun #241C1D (Token-Block am Ende von `style.css`)
- Schriften: Young Serif (Überschriften), UnifrakturMaguntia (nur „Gasthof“ im Logo), Grenze (Speisekarte, Kursives), Albert Sans (Fließtext)
- Wirtshausschild als SVG im Titelbild der Startseite

## Feedback des Auftraggebers (offen)
- Farbe Weinrot & Leinen: „deutlich besser“, Richtung passt
- **Schriften (primär und sekundär) gefallen noch nicht**, sollen ersetzt werden
- Wirkt insgesamt **noch zu billig, auch von der Anordnung** („Autobahngastro“)
- Zielbild: **moderner Geheimtipp** – traditionelles Gasthaus mit modernem Touch und Sinn für Ästhetik, hochwertig, repräsentativ für HWA
- Unterseiten-Aufbau beibehalten, aber hochwertiger gestalten
- Nicht verwenden: Beige + Terrakotta (wirkt wie Claude), Gelb/Schwarz, Instrument Serif, generische „KI-Website“-Muster

## Bilder
Platzhalter in `img/`. Der Auftraggeber generiert 9 Bilder (aussen, stube, schaeufele, brotzeit, biergarten, kueche, zimmer, saal, zapfen) und legt sie in `img/original/`.
Danach: zuschneiden, als WebP (Qualität ca. 80) speichern, Ecken auf Gemini-Wasserzeichen prüfen, Alt-Texte prüfen, `img/original/` wieder entfernen, Bildnachweis „KI-generiert“ ergänzen.

## Regeln
- Nichts live schalten ohne ausdrückliches „live“ (dann Fast-Forward von Branch auf `main`)
- Schriften nur lokal und mit freier Lizenz (OFL), Lizenzdateien in `fonts/`
- Vor jeder Vorlage selbst prüfen: Screenshots Desktop (1440) und Handy (390), keine Konsolenfehler, kein seitliches Scrollen, Kontraste ≥ 4,5:1, HTML-Validierung
- Ton gegenüber dem Auftraggeber: professionell, sachlich, nicht salopp
