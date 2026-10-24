// Erhöht die Cache-Version ?v=JJJJMMTTNN in allen HTML-Dateien der Hauptseite.
// Nötig nach jeder Änderung an style.css, legal.css oder script.js, sonst sehen Besucher bis zu 10 Minuten den alten Stand.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = ['index.html', '404.html', 'impressum.html', 'datenschutz.html', 'hallo/index.html'];
const pattern = /\?v=(\d{10})/g;

const d = new Date();
const today = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

// Höchste vorhandene Version suchen, damit die neue immer größer ist
let highest = '0';
for (const f of files) {
  for (const [, v] of readFileSync(join(root, f), 'utf8').matchAll(pattern)) if (v > highest) highest = v;
}
const next = highest.startsWith(today)
  ? today + String(Number(highest.slice(8)) + 1).padStart(2, '0')
  : today + '01';

for (const f of files) {
  const path = join(root, f);
  const before = readFileSync(path, 'utf8');
  writeFileSync(path, before.replace(pattern, `?v=${next}`));
}
console.log(`Cache-Version: ${highest} → ${next}`);
