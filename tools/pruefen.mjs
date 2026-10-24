// Prüft die Website vor dem Livegang, so wie in der HWA-Regel festgelegt:
// sechs Breiten (320–1280), Layout-Sprung (CLS), seitlicher Überlauf, zu kleine Schrift,
// Ruckeln beim Scrollen (Frames > 25 ms), Konsole und Lighthouse am Handy.
// Aufruf: cd tools && npm install (einmalig), danach npm run pruefen
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';
import puppeteer from 'puppeteer-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const widths = [320, 375, 768, 860, 1024, 1280];
const pages = ['/', '/hallo/', '/impressum.html', '/datenschutz.html', '/404.html'];
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

// Kleiner Server für die lokale Prüfung
const server = createServer(async (req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  if (path.endsWith('/')) path += 'index.html';
  const file = join(root, path);
  if (!file.startsWith(root) || !existsSync(file)) { res.writeHead(404); res.end(await readFile(join(root, '404.html'))); return; }
  res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
  res.end(await readFile(file));
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
const problems = [];
const rows = [];

for (const path of pages) {
  for (const w of path === '/' ? widths : [320, 1280]) {
    process.stdout.write(`${path} ${w} … `);
    const page = await browser.newPage();
    const logs = [];
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.text().slice(0, 140)); });
    page.on('pageerror', (e) => logs.push('Fehler: ' + e.message));
    await page.evaluateOnNewDocument(() => {
      sessionStorage.setItem('hwaIntroPlayed', '1');
      window.__cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.setViewport({ width: w, height: w < 700 ? 760 : 860 });
    await page.goto(base + path, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));
    const r = await page.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      let long = 0, last = performance.now(), run = true;
      (function f(t) { if (!run) return; if (t - last > 25) long++; last = t; requestAnimationFrame(f); })(performance.now());
      const H = document.documentElement.scrollHeight;
      for (let y = 0; y < H; y += 150) { scrollTo({ top: y, behavior: 'instant' }); await sleep(60); }
      await sleep(1500); run = false;
      const hidden = [...document.querySelectorAll('.reveal,.section-title')].filter((e) => !e.classList.contains('is-in')).length;
      const small = [...document.querySelectorAll('body *')].filter((e) => e.offsetParent && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12).length;
      const overflow = document.documentElement.scrollWidth - innerWidth;
      return { long, hidden, small, overflow, cls: window.__cls };
    });
    const ok = r.overflow <= 0 && r.cls < 0.01 && r.small === 0 && r.hidden === 0 && r.long === 0 && logs.length === 0;
    rows.push({ Seite: path, Breite: w, CLS: r.cls.toFixed(3), Überlauf: r.overflow, 'Schrift < 12 px': r.small, 'Nicht eingeblendet': r.hidden, 'Frames > 25 ms': r.long, Konsole: logs.length, OK: ok ? 'ja' : 'NEIN' });
    console.log(ok ? 'ok' : 'Problem');
    if (!ok) problems.push(`${path} bei ${w} px: ${JSON.stringify(r)} ${logs.join(' | ')}`);
    await page.close();
  }
}
await browser.close();
console.table(rows);

// Lighthouse am Handy für die Startseite
try {
  const lh = join(dirname(fileURLToPath(import.meta.url)), 'node_modules', '.bin', 'lighthouse');
  // Asynchron starten, sonst blockiert der Aufruf den Testserver in diesem Prozess
  const { stdout: out } = await promisify(execFile)(lh, [base + '/', '--quiet', '--output=json', '--chrome-flags=--headless=new'], { env: { ...process.env, CHROME_PATH: chrome }, maxBuffer: 64 * 1024 * 1024, timeout: 180000 });
  const report = JSON.parse(out);
  const scores = Object.fromEntries(Object.entries(report.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
  console.log('Lighthouse Handy:', scores, 'LCP', report.audits['largest-contentful-paint'].displayValue, 'CLS', report.audits['cumulative-layout-shift'].displayValue);
  if (scores.performance < 95) problems.push(`Lighthouse Performance ${scores.performance} (Ziel ≥ 95)`);
  for (const k of ['accessibility', 'best-practices', 'seo']) if (scores[k] < 100) problems.push(`Lighthouse ${k} ${scores[k]}`);
} catch (e) {
  problems.push('Lighthouse lief nicht: ' + e.message.split('\n')[0]);
}

server.close();
if (problems.length) {
  console.log('\nProbleme:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log('\nAlles in Ordnung.');
