# Gasthof Grünlinger – Übergabe für die Weiterarbeit

Fiktiver Gasthof (Demo von HWA), Ort: fiktives Lindenreuth im Fichtelgebirge (gleicher Ort wie die Schreinerei-Demo).
Stand: Branch `claude/quirky-heisenberg-8ppght`, noch nicht live. `main` (live) enthält die Gasthof-Demo noch nicht.

## Aufbau
Statische Seiten, gemeinsames `style.css` und `script.js`, keine Build-Tools:
`index.html` (Start), `speisekarte.html`, `reservieren.html`, `zimmer.html`, `feiern.html`, `termine.html`, `gutscheine.html`, `kontakt.html`.
Header und Footer stehen in jeder Datei identisch und müssen bei Änderungen überall angepasst werden.

## Funktionen (alle im Browser getestet)
- Live-Öffnungsstatus nach deutscher Zeit (Ruhetage Mo/Di, Betriebsurlaub 7.–20.1., Kirchweihmontag geöffnet)
- Tageskarte mit Wochentag-Auswahl, wählt den heutigen Tag
- Speisekarte mit Kategorien, Filtern (vegetarisch, ohne Gluten), Allergenen, Druckansicht
- Reservierung mit Kalender, simulierter Auslastung, .ics-Download; `reservieren.html?datum=JJJJ-MM-TT` wählt ein Datum vor
- Zimmer-Preisrechner, Raumfinder für Feiern; beide füllen `kontakt.html?thema=…&nachricht=…` vor
- Termine werden aus dem aktuellen Datum berechnet (Startseite zeigt 3, Terminseite 8)
- Gutschein-Generator mit Live-Vorschau und Druck (als „Muster, nicht einlösbar“ gekennzeichnet)
- Alle Daten (Öffnungszeiten, Tageskarte, Zimmerpreise) stehen oben in `script.js`

## Gestaltung, aktueller Stand (Richtung „Abendstube“, vom Auftraggeber gewählt am 5.10.2026)
- Dunkel geführt: Rauchbraun- und Weinrot-Flächen im Wechsel mit Leinen, Messing für feine Linien. Keine Schatten, keine runden Ecken.
- Farben: Weinrot #5A1E29, Messing #B08D57 / hell #D2B888 / Schrift auf Hell #7A5C2E, Leinen #F8F6F2, Rauchbraun #241C1D (Token-Block oben in `style.css`)
- Schriften: Bodoni Moda (Überschriften, Kursive als Akzent; große Grade mit `opsz` 28, sonst zu feine Haarstriche), Geist (Text, Labels in Versalien mit Sperrung), UnifrakturMaguntia nur für „Gasthof“ im Logo. Alle Umlaute und ß sind in den Schriftdateien enthalten, geprüft.
- Header: Logo mittig, Navigation links und rechts; unter 1180 px Vollbild-Menü
- Startseite: Titelbild (Außenansicht, Text mittig), Das Haus, Tageskarte auf Weinrot, Herkunft (Bierdeckel), Biergarten-Zitat, Teaser auf Dunkel, Termine, Gutschein
- Wirtshausschild-SVG entfernt (das Foto zeigt bereits ein Schild)

## Feedback des Auftraggebers
- Weinrot & Leinen passt. Alte Schriften (Young Serif, Albert Sans) und die „Autobahngastro“-Anordnung waren der Grund für den Umbau.
- Zielbild: moderner Geheimtipp, traditionelles Gasthaus mit modernem Touch, hochwertig, repräsentativ für HWA. Unterseiten-Aufbau bleibt.
- Aus drei Vorschlägen (Tageslicht, Abendstube, Hauszeichen) gewählt: Abendstube. Ausdrücklicher Hinweis: Umlaute sauber darstellen.
- Nicht verwenden: Beige + Terrakotta, Gelb/Schwarz, Instrument Serif, generische „KI-Website“-Muster
- Offen: Rückmeldung zum Umbau

## Bilder
Die 9 Bilder des Auftraggebers sind eingebaut (WebP, Qualität 80, 1264 × 848 bzw. 848 × 1264), Ecken auf Wasserzeichen geprüft, Alt-Texte an die Motive angepasst.
Statt „brotzeit“ gibt es ein zweites Küchenbild `kloesse.webp` (Speisekarte). Kopf der Speisekarte: Schäufele.

## Regeln
- Nichts live schalten ohne ausdrückliches „live“ (dann Fast-Forward von Branch auf `main`)
- Schriften nur lokal und mit freier Lizenz (OFL), Lizenzdateien in `fonts/`
- Vor jeder Vorlage selbst prüfen: Screenshots Desktop (1440) und Handy (390), keine Konsolenfehler, kein seitliches Scrollen, Kontraste ≥ 4,5:1, HTML-Validierung
- Ton gegenüber dem Auftraggeber: professionell, sachlich, nicht salopp
