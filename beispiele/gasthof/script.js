// ===== Gasthof Grünlinger – Beispielprojekt von HWA =====
// Alle Daten (Öffnungszeiten, Tageskarte, Termine, Preise) stehen oben gesammelt,
// damit ein Wirt sie ohne Programmierkenntnisse anpassen könnte.

document.documentElement.classList.add('js');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Daten ----------

// Öffnungszeiten in Minuten ab Mitternacht. 0 = Sonntag … 6 = Samstag
const HOURS = {
  0: { open: [[660, 1260]], kitchen: [[690, 840], [1050, 1200]] },
  3: { open: [[690, 840], [1020, 1380]], kitchen: [[690, 810], [1050, 1260]] },
  4: { open: [[690, 840], [1020, 1380]], kitchen: [[690, 810], [1050, 1260]] },
  5: { open: [[690, 840], [1020, 1380]], kitchen: [[690, 810], [1050, 1260]] },
  6: { open: [[690, 840], [1020, 1380]], kitchen: [[690, 810], [1050, 1260]] }
};
const VACATION = { from: [1, 7], to: [1, 20] };       // Betriebsurlaub 7. bis 20. Januar
const BEERGARDEN_MONTHS = [5, 6, 7, 8, 9];            // Mai bis September
const BOOKING_DAYS = 90;                              // so weit im Voraus reservierbar

const TAFEL = {
  3: [['Saure Zipfel mit Bauernbrot', 'Bratwürste in Essigsud mit Zwiebeln', '12,50'], ['Kartoffelsuppe mit Majoran', '', '6,90']],
  4: [['Krenfleisch mit Salzkartoffeln', 'Gekochtes Rindfleisch, frisch geriebener Meerrettich', '16,90'], ['Kartoffelpuffer mit Apfelmus', 'vegetarisch', '11,50']],
  5: [['Forelle Müllerin Art', 'Mit Petersilienkartoffeln und Gurkensalat', '19,50'], ['Spinatknödel mit brauner Butter', 'vegetarisch', '13,90']],
  6: [['Krautwickel mit Kartoffelbrei', 'Wie bei der Großmutter', '15,50'], ['Leberknödelsuppe', '', '6,50']],
  0: [['Sauerbraten mit Lebkuchensoße', 'Mit Klößen und Apfelrotkohl', '21,50'], ['Schäufele mit Kloß', 'Solange der Vorrat reicht', '19,90']]
};
const DAY_NAMES = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const DAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

const ROOMS = {
  kammer: { name: 'Kammer (Einzelzimmer)', price: 72 },
  stube: { name: 'Stubenzimmer (Doppelzimmer)', price: 104 },
  boden: { name: 'Dachboden (Familienzimmer)', price: 138 }
};
const DOG_PER_NIGHT = 12;
const MENU_PER_PERSON = 42;

// ---------- Hilfsfunktionen für Datum und Zeit ----------

// Aktuelle Zeit in Deutschland, unabhängig von der Zeitzone des Besuchers
function berlinNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
  }).formatToParts(new Date());
  const get = (t) => Number((parts.find((p) => p.type === t) || {}).value);
  const date = new Date(get('year'), get('month') - 1, get('day'), 12);
  return { date, minutes: get('hour') * 60 + get('minute') };
}
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const fmtTime = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const fmtDate = (d) => `${DAY_NAMES[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
const euro = (n) => n.toLocaleString('de-DE', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';

function isVacation(d) {
  const m = d.getMonth() + 1, day = d.getDate();
  return m === VACATION.from[0] && day >= VACATION.from[1] && day <= VACATION.to[1];
}
// Ausnahme: Am Kirchweihmontag (Montag nach dem dritten Sonntag im Oktober) ist geöffnet
function kirchweihMonday(y) { const first = new Date(y, 9, 1, 12); return new Date(y, 9, 1 + ((7 - first.getDay()) % 7) + 14 + 1, 12); }
function isExtraOpen(d) { return d.getMonth() === 9 && d.getDate() === kirchweihMonday(d.getFullYear()).getDate(); }
function hoursFor(d) { return HOURS[d.getDay()] || (isExtraOpen(d) ? HOURS[3] : null); }
function isOpenDay(d) { return !!hoursFor(d) && !isVacation(d); }

const NOW = berlinNow();
const TODAY = NOW.date;

// ---------- Header, Menü ----------
(function header() {
  const headerEl = document.querySelector('.site-header');
  const hero = document.querySelector('.hero');
  const update = () => {
    const limit = hero ? hero.offsetHeight - headerEl.offsetHeight - 40 : 40;
    headerEl.classList.toggle('is-solid', window.scrollY > limit);
    headerEl.classList.toggle('is-scrolled', window.scrollY > 10);
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');
  const label = toggle.querySelector('.nav-toggle-label');
  const set = (open) => {
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Schließen' : 'Menü';
  };
  toggle.addEventListener('click', () => set(!nav.classList.contains('is-open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { set(false); toggle.focus(); } });
})();

// ---------- Öffnungsstatus ----------
function nextOpening(fromDate, fromMinutes) {
  for (let i = 0; i < 30; i++) {
    const d = addDays(fromDate, i);
    if (!isOpenDay(d)) continue;
    for (const [start] of hoursFor(d).open) {
      if (i > 0 || start > fromMinutes) return { date: d, minutes: start, offset: i };
    }
  }
  return null;
}

function statusInfo() {
  const now = berlinNow();
  const d = now.date, m = now.minutes;
  if (isVacation(d)) {
    const next = nextOpening(d, m);
    return { open: false, short: 'Betriebsurlaub', long: `Betriebsurlaub. Wir sind ab ${fmtDate(next.date)} wieder für Sie da.` };
  }
  const today = isVacation(d) ? null : hoursFor(d);
  if (today) {
    const openRange = today.open.find(([a, b]) => m >= a && m < b);
    if (openRange) {
      const kitchen = today.kitchen.find(([a, b]) => m >= a && m < b);
      const nextKitchen = today.kitchen.find(([a]) => a > m);
      let kitchenText;
      if (kitchen) kitchenText = `Küche bis ${fmtTime(kitchen[1])} Uhr`;
      else if (nextKitchen && nextKitchen[0] < openRange[1]) kitchenText = `warme Küche wieder ab ${fmtTime(nextKitchen[0])} Uhr`;
      else kitchenText = `geöffnet bis ${fmtTime(openRange[1])} Uhr`;
      const tiny = kitchen ? `Geöffnet · Küche bis ${fmtTime(kitchen[1])}` : `Geöffnet bis ${fmtTime(openRange[1])}`;
      return { open: true, tiny, short: `Jetzt geöffnet · ${kitchenText}`, long: `Jetzt geöffnet, ${kitchenText}.` };
    }
  }
  const next = nextOpening(d, m);
  if (!next) return { open: false, short: 'Geschlossen', long: 'Derzeit geschlossen.' };
  const when = next.offset === 0 ? 'heute' : next.offset === 1 ? 'morgen' : `am ${DAY_NAMES[next.date.getDay()]}`;
  const reason = today ? 'Geschlossen' : 'Heute Ruhetag';
  const whenShort = next.offset === 0 ? 'heute' : next.offset === 1 ? 'morgen' : DAY_SHORT[next.date.getDay()];
  return { open: false, tiny: `${today ? 'Geschlossen' : 'Ruhetag'} · ab ${whenShort} ${fmtTime(next.minutes)}`, short: `${reason} · öffnet ${when} um ${fmtTime(next.minutes)} Uhr`, long: `${reason}. Wir öffnen ${when} um ${fmtTime(next.minutes)} Uhr.` };
}

function renderStatus() {
  const s = statusInfo();
  document.querySelectorAll('[data-status]').forEach((el) => {
    el.hidden = false;
    el.classList.toggle('is-open', s.open);
    el.querySelector('[data-status-text]').textContent = el.classList.contains('header-status') && s.tiny ? s.tiny : s.short;
  });
  document.querySelectorAll('[data-status-long]').forEach((el) => { el.textContent = s.long; });
  document.querySelectorAll('#hoursTable tr[data-days]').forEach((tr) => {
    tr.classList.toggle('is-today', tr.dataset.days.split(',').map(Number).includes(berlinNow().date.getDay()));
  });
  const bg = document.querySelector('[data-beergarden]');
  if (bg) {
    const month = TODAY.getMonth() + 1;
    bg.textContent = BEERGARDEN_MONTHS.includes(month)
      ? 'Geöffnet bei schönem Wetter, unter den Kastanien'
      : 'Winterpause. Ab Mai sitzen wir wieder unter den Kastanien.';
  }
}
renderStatus();
setInterval(renderStatus, 60000);

// ---------- Tageskarte ----------
(function tafel() {
  const tabs = [...document.querySelectorAll('.tafel-days [role="tab"]')];
  const board = document.getElementById('tafelBoard');
  const dayEl = board.querySelector('[data-tafel-day]');
  const noteEl = board.querySelector('[data-tafel-note]');
  const list = board.querySelector('[data-tafel-list]');
  const heroDish = document.querySelector('[data-today-dish]');
  const todayDay = TODAY.getDay();
  const servingToday = isOpenDay(TODAY) && TAFEL[todayDay];

  function render(day, note) {
    board.classList.add('is-changing');
    setTimeout(() => {
      dayEl.textContent = day === todayDay && servingToday ? `Heute, ${DAY_NAMES[day]}` : DAY_NAMES[day];
      noteEl.hidden = !note;
      noteEl.textContent = note || '';
      list.innerHTML = '';
      TAFEL[day].forEach(([dish, sub, price]) => {
        const li = document.createElement('li');
        const name = document.createElement('span');
        name.className = 'tafel-dish';
        name.textContent = dish;
        if (sub) { const s = document.createElement('small'); s.textContent = sub; name.append(s); }
        const p = document.createElement('span');
        p.className = 'tafel-price';
        p.textContent = price;
        li.append(name, p);
        list.append(li);
      });
      board.classList.remove('is-changing');
    }, reducedMotion ? 0 : 180);
  }

  function select(tab, focus, note) {
    tabs.forEach((t) => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    if (focus) tab.focus();
    render(Number(tab.dataset.day), note);
  }

  tabs.forEach((tab, i) => {
    if (Number(tab.dataset.day) === todayDay && servingToday) tab.classList.add('is-today');
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      const n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (n) { e.preventDefault(); select(tabs[(i + n + tabs.length) % tabs.length], true); }
    });
  });

  // Startansicht: heute, oder der nächste Öffnungstag
  let start = tabs.find((t) => Number(t.dataset.day) === todayDay);
  let note = '';
  if (!servingToday) {
    const next = nextOpening(TODAY, 24 * 60);
    start = tabs.find((t) => Number(t.dataset.day) === next.date.getDay()) || tabs[0];
    note = isVacation(TODAY) ? 'Wir sind im Betriebsurlaub. Danach steht wieder das hier auf der Tafel:' : 'Heute ist Ruhetag. Am nächsten Öffnungstag gibt es:';
  }
  select(start, false, note);

  if (heroDish) {
    heroDish.textContent = servingToday ? TAFEL[todayDay][0][0] : `Ab ${DAY_NAMES[nextOpening(TODAY, 24 * 60).date.getDay()]}: ${TAFEL[Number(start.dataset.day)][0][0]}`;
  }
})();

// ---------- Bierdeckel umdrehen ----------
document.querySelectorAll('.coaster').forEach((c) => {
  c.addEventListener('click', () => c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true')));
});

// ---------- Speisekarte: Kategorien, Filter, Allergene, Drucken ----------
(function menu() {
  const card = document.getElementById('menuCard');
  const cats = [...document.querySelectorAll('.menu-cats [role="tab"]')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const empty = card.querySelector('[data-menu-empty]');
  const legend = document.getElementById('allergenLegend');
  let cat = 'alle';

  function apply() {
    const need = filters.filter((f) => f.checked).map((f) => f.dataset.filter);
    let visible = 0;
    card.querySelectorAll('.menu-group').forEach((group) => {
      const inCat = cat === 'alle' || group.dataset.cat === cat;
      let groupVisible = 0;
      group.querySelectorAll('.dish').forEach((dish) => {
        const tags = (dish.dataset.tags || '').split(' ');
        const ok = inCat && need.every((n) => tags.includes(n));
        dish.classList.toggle('is-hidden', !ok);
        if (ok) groupVisible++;
      });
      group.classList.toggle('is-hidden', groupVisible === 0);
      visible += groupVisible;
    });
    empty.hidden = visible > 0;
  }

  cats.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      cats.forEach((b) => { const on = b === btn; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
      cat = btn.dataset.cat;
      apply();
    });
    btn.addEventListener('keydown', (e) => {
      const n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (n) { e.preventDefault(); const next = cats[(i + n + cats.length) % cats.length]; next.focus(); next.click(); }
    });
  });
  filters.forEach((f) => f.addEventListener('change', apply));
  document.getElementById('showAllergens').addEventListener('change', (e) => {
    card.classList.toggle('show-allergens', e.target.checked);
    legend.hidden = !e.target.checked;
  });
  document.getElementById('printMenu').addEventListener('click', () => printOnly('print-menu'));
})();

function printOnly(cls) {
  document.body.classList.add(cls);
  const done = () => { document.body.classList.remove(cls); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  window.print();
  setTimeout(done, 1000);
}

// ---------- Kalenderdatei (.ics) ----------
function downloadIcs(filename, events) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Gasthof Gruenlinger//Beispielprojekt//DE', 'CALSCALE:GREGORIAN'];
  events.forEach((ev, i) => {
    lines.push('BEGIN:VEVENT', `UID:${stamp}-${i}@gruenlinger.example`, `DTSTAMP:${stamp}`);
    if (ev.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${iso(ev.start).replace(/-/g, '')}`, `DTEND;VALUE=DATE:${iso(addDays(ev.end || ev.start, 1)).replace(/-/g, '')}`);
    } else {
      const t = (d, m) => `${iso(d).replace(/-/g, '')}T${String(Math.floor(m / 60)).padStart(2, '0')}${String(m % 60).padStart(2, '0')}00`;
      lines.push(`DTSTART:${t(ev.start, ev.from)}`, `DTEND:${t(ev.start, ev.to)}`);
    }
    lines.push(`SUMMARY:${esc(ev.title)}`, `DESCRIPTION:${esc(ev.text || '')}`, 'LOCATION:Gasthof Grünlinger\\, Dorfplatz 3\\, Lindenreuth', 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

// ---------- Tischreservierung ----------
const Reservation = (function reservation() {
  const form = document.getElementById('reserveForm');
  const grid = document.getElementById('calGrid');
  const monthEl = document.getElementById('calMonth');
  const navs = [...document.querySelectorAll('.cal-nav')];
  const slotsEl = document.getElementById('slots');
  const guestsOut = document.getElementById('guestsOut');
  const guestsHint = document.getElementById('guestsHint');
  const areaHint = document.getElementById('areaHint');
  const gardenRadio = form.querySelector('input[name="bereich"][value="Biergarten"]');
  const summary = document.getElementById('reserveSummary');
  const done = document.getElementById('reserveDone');
  const last = addDays(TODAY, BOOKING_DAYS);

  const state = { date: null, time: null, guests: 2, view: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1, 12) };

  function bookable(d) {
    if (d < TODAY && !sameDay(d, TODAY)) return false;
    if (d > last) return false;
    if (!isOpenDay(d)) return false;
    if (sameDay(d, TODAY)) return slotsFor(d).length > 0;
    return true;
  }

  // Zeitfenster: alle 30 Minuten, letzte Reservierung 30 Minuten vor Küchenschluss
  function slotsFor(d) {
    const h = hoursFor(d);
    if (!h) return [];
    const out = [];
    h.kitchen.forEach(([a, b], idx) => {
      for (let t = a; t <= b - 30; t += 30) {
        if (sameDay(d, TODAY) && t < NOW.minutes + 60) continue;
        out.push({ t, meal: idx === 0 ? 'Mittags' : 'Abends' });
      }
    });
    return out;
  }

  // Simulierte Auslastung, damit die Demo realistisch wirkt (im echten Betrieb aus dem Reservierungsbuch)
  function load(d, t) {
    const key = `${iso(d)}-${t}-${state.guests > 6 ? 'g' : 's'}`;
    let h = 2166136261;
    for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
    let v = Math.abs(h) % 100;
    const peak = (d.getDay() === 5 || d.getDay() === 6) && t >= 1110 && t <= 1170;
    const sundayLunch = d.getDay() === 0 && t >= 720 && t <= 750;
    if (peak || sundayLunch) v -= 30;
    if (state.guests > 6) v -= 15;
    return v < 10 ? 'full' : v < 28 ? 'few' : 'free';
  }

  function renderCalendar() {
    const v = state.view;
    monthEl.textContent = `${MONTHS[v.getMonth()]} ${v.getFullYear()}`;
    navs[0].disabled = v.getFullYear() === TODAY.getFullYear() && v.getMonth() === TODAY.getMonth();
    navs[1].disabled = new Date(v.getFullYear(), v.getMonth() + 1, 1) > last;
    grid.innerHTML = '';
    ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach((w) => {
      const el = document.createElement('span');
      el.className = 'cal-wd';
      el.textContent = w;
      el.setAttribute('aria-hidden', 'true');
      grid.append(el);
    });
    const offset = (v.getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) grid.append(document.createElement('span'));
    const days = new Date(v.getFullYear(), v.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= days; day++) {
      const d = new Date(v.getFullYear(), v.getMonth(), day, 12);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cal-day';
      b.textContent = day;
      b.dataset.date = iso(d);
      const ok = bookable(d);
      b.disabled = !ok;
      if (!isOpenDay(d)) b.classList.add('is-closed');
      if (sameDay(d, TODAY)) b.classList.add('is-today');
      const reason = !isOpenDay(d) ? (isVacation(d) ? ', Betriebsurlaub' : ', Ruhetag') : !ok ? ', nicht reservierbar' : '';
      b.setAttribute('aria-label', `${fmtDate(d)}${reason}`);
      b.setAttribute('aria-pressed', String(!!state.date && sameDay(d, state.date)));
      grid.append(b);
    }
  }

  function renderSlots() {
    slotsEl.innerHTML = '';
    if (!state.date) {
      slotsEl.innerHTML = '<p class="slots-empty">Bitte wählen Sie zuerst einen Tag.</p>';
      return;
    }
    let meal = '';
    slotsFor(state.date).forEach(({ t, meal: m }) => {
      if (m !== meal) {
        meal = m;
        const g = document.createElement('p');
        g.className = 'slot-group';
        g.textContent = m;
        slotsEl.append(g);
      }
      const status = load(state.date, t);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot';
      b.dataset.time = t;
      b.textContent = fmtTime(t);
      b.disabled = status === 'full';
      if (status === 'few') { const s = document.createElement('small'); s.textContent = 'fast voll'; b.append(s); }
      b.setAttribute('aria-label', `${fmtTime(t)} Uhr${status === 'full' ? ', ausgebucht' : status === 'few' ? ', nur noch wenige Plätze' : ''}`);
      b.setAttribute('aria-pressed', String(state.time === t));
      if (status === 'full' && state.time === t) state.time = null;
      slotsEl.append(b);
    });
  }

  function renderArea() {
    const inSeason = BEERGARDEN_MONTHS.includes((state.date || TODAY).getMonth() + 1);
    gardenRadio.disabled = !inSeason;
    if (!inSeason && gardenRadio.checked) form.querySelector('input[value="Wirtsstube"]').checked = true;
    areaHint.hidden = inSeason;
    areaHint.textContent = 'Der Biergarten ist von Mai bis September geöffnet.';
  }

  function renderSummary() {
    const area = form.querySelector('input[name="bereich"]:checked').value;
    if (!state.date) { summary.textContent = 'Noch kein Termin gewählt.'; return; }
    summary.innerHTML = '';
    const strong = document.createElement('strong');
    strong.textContent = fmtDate(state.date) + (state.time !== null ? `, ${fmtTime(state.time)} Uhr` : '');
    summary.append(strong, document.createTextNode(` · ${state.guests} ${state.guests === 1 ? 'Person' : 'Personen'} · ${area}`));
    if (state.time === null) summary.append(document.createTextNode(' · Uhrzeit fehlt noch'));
  }

  function setGuests(n) {
    state.guests = Math.max(1, Math.min(12, n));
    guestsOut.textContent = `${state.guests} ${state.guests === 1 ? 'Person' : 'Personen'}`;
    form.querySelector('[data-step="-1"]').disabled = state.guests === 1;
    form.querySelector('[data-step="1"]').disabled = state.guests === 12;
    guestsHint.innerHTML = state.guests === 12 ? 'Mehr als zwölf Personen? <a href="#feiern">Dann planen wir Ihre Feier mit Ihnen.</a>' : 'Ab 13 Personen planen wir gern Ihre Feier mit Ihnen.';
    renderSlots();
    renderSummary();
  }

  function selectDate(d) {
    state.date = d;
    state.time = null;
    state.view = new Date(d.getFullYear(), d.getMonth(), 1, 12);
    renderCalendar();
    renderArea();
    renderSlots();
    renderSummary();
    document.getElementById('err-slot').textContent = '';
  }

  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.cal-day');
    if (!b || b.disabled) return;
    selectDate(fromIso(b.dataset.date));
    grid.querySelector(`[data-date="${b.dataset.date}"]`).focus();
  });
  // Pfeiltasten im Kalender
  grid.addEventListener('keydown', (e) => {
    const b = e.target.closest('.cal-day');
    const move = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!b || !move) return;
    e.preventDefault();
    let d = fromIso(b.dataset.date);
    for (let i = 0; i < 60; i++) {
      d = addDays(d, move > 0 ? Math.min(move, 7) : Math.max(move, -7));
      if (d < TODAY || d > last) return;
      if (bookable(d)) break;
    }
    if (d.getMonth() !== state.view.getMonth()) { state.view = new Date(d.getFullYear(), d.getMonth(), 1, 12); renderCalendar(); }
    const target = grid.querySelector(`[data-date="${iso(d)}"]`);
    if (target && !target.disabled) target.focus();
  });
  navs.forEach((n) => n.addEventListener('click', () => {
    state.view = new Date(state.view.getFullYear(), state.view.getMonth() + Number(n.dataset.cal), 1, 12);
    renderCalendar();
  }));
  slotsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.slot');
    if (!b || b.disabled) return;
    state.time = Number(b.dataset.time);
    slotsEl.querySelectorAll('.slot').forEach((s) => s.setAttribute('aria-pressed', String(s === b)));
    document.getElementById('err-slot').textContent = '';
    renderSummary();
  });
  form.querySelectorAll('.stepper-btn').forEach((b) => b.addEventListener('click', () => setGuests(state.guests + Number(b.dataset.step))));
  form.querySelectorAll('input[name="bereich"]').forEach((r) => r.addEventListener('change', renderSummary));

  const nameField = document.getElementById('r-name');
  const emailField = document.getElementById('r-email');
  function err(id, msg, field) {
    document.getElementById(id).textContent = msg;
    if (field) field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }
  [nameField, emailField].forEach((f) => f.addEventListener('input', () => err('err-' + f.id, '', f)));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const okSlot = err('err-slot', !state.date ? 'Bitte wählen Sie einen Tag.' : state.time === null ? 'Bitte wählen Sie eine Uhrzeit.' : '');
    const okName = err('err-r-name', nameField.value.trim().length > 1 ? '' : 'Bitte geben Sie Ihren Namen an.', nameField);
    const okMail = err('err-r-email', /\S+@\S+\.\S+/.test(emailField.value) ? '' : 'Bitte geben Sie eine gültige E-Mail-Adresse an.', emailField);
    if (!okSlot) { (slotsEl.querySelector('.slot:not(:disabled)') || grid.querySelector('.cal-day:not(:disabled)')).focus(); return; }
    if (!okName) { nameField.focus(); return; }
    if (!okMail) { emailField.focus(); return; }

    const area = form.querySelector('input[name="bereich"]:checked').value;
    const extras = [...form.querySelectorAll('.extras input:checked')].map((x) => x.value);
    document.getElementById('reserveDoneText').textContent =
      `${fmtDate(state.date)} um ${fmtTime(state.time)} Uhr, ${state.guests} ${state.guests === 1 ? 'Person' : 'Personen'} in der ${area === 'Biergarten' ? 'Biergarten' : 'Wirtsstube'}` +
      `${extras.length ? ` (${extras.join(', ')})` : ''}. Wir freuen uns auf Sie, ${nameField.value.trim().split(' ')[0]}!`;
    done.dataset.date = iso(state.date);
    done.dataset.time = state.time;
    done.dataset.guests = state.guests;
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });

  document.getElementById('reserveIcs').addEventListener('click', () => {
    const d = fromIso(done.dataset.date), t = Number(done.dataset.time);
    downloadIcs('reservierung-gasthof-gruenlinger.ics', [{
      start: d, from: t, to: t + 120,
      title: 'Tisch im Gasthof Grünlinger',
      text: `Reservierung für ${done.dataset.guests} Personen. Telefon 0171 39200 87.`
    }]);
  });
  document.getElementById('reserveAgain').addEventListener('click', () => {
    form.reset();
    state.date = null; state.time = null;
    setGuests(2);
    renderCalendar(); renderArea(); renderSlots(); renderSummary();
    done.hidden = true;
    form.hidden = false;
    grid.querySelector('.cal-day:not(:disabled)').focus();
  });

  setGuests(2);
  renderCalendar();
  renderArea();

  return {
    bookable,
    open(d) {
      if (!form.hidden && bookable(d)) selectDate(d);
      document.getElementById('reservieren').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  };
})();

// ---------- Zimmer-Preisrechner ----------
(function roomCalc() {
  const form = document.getElementById('roomCalc');
  const arrival = document.getElementById('c-arrival');
  const nights = document.getElementById('c-nights');
  const dog = document.getElementById('c-dog');
  const result = document.getElementById('calcResult');
  for (let i = 1; i <= 14; i++) nights.add(new Option(`${i} ${i === 1 ? 'Nacht' : 'Nächte'}`, i));
  nights.value = '2';
  arrival.min = iso(TODAY);
  arrival.max = iso(addDays(TODAY, 365));
  arrival.value = iso(addDays(TODAY, 14));

  function calc() {
    const room = ROOMS[form.querySelector('input[name="room"]:checked').value];
    const n = Number(nights.value);
    const base = room.price * n;
    const dogCost = dog.checked ? DOG_PER_NIGHT * n : 0;
    const discount = n >= 3 ? Math.round(base * 0.1) : 0;
    const total = base + dogCost - discount;
    const a = arrival.value ? fromIso(arrival.value) : null;
    const rows = [[`${n} × ${euro(room.price)}`, euro(base)]];
    if (dogCost) rows.push(['Hund', euro(dogCost)]);
    if (discount) rows.push(['Ab drei Nächten −10 %', '− ' + euro(discount), 'saving']);
    if (a) rows.push(['Abreise', fmtDate(addDays(a, n))]);
    rows.push(['Gesamt', euro(total), 'total']);
    result.innerHTML = '';
    rows.forEach(([k, v, cls]) => {
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      if (cls) { dt.className = cls; dd.className = cls; }
      result.append(dt, dd);
    });
    return { room, n, total, a, dog: dog.checked };
  }
  form.addEventListener('input', calc);
  form.addEventListener('change', calc);
  calc();

  document.getElementById('roomAsk').addEventListener('click', () => {
    const c = calc();
    prefillAsk('Zimmeranfrage',
      `Ich möchte gern folgendes Zimmer anfragen:\n${c.room.name}\nAnreise: ${c.a ? fmtDate(c.a) : 'noch offen'}, ${c.n} ${c.n === 1 ? 'Nacht' : 'Nächte'}${c.dog ? ', mit Hund' : ''}\nBerechneter Preis: ${euro(c.total)}`);
  });
})();

// ---------- Raumfinder für Feiern ----------
(function finder() {
  const range = document.getElementById('guestRange');
  const out = document.getElementById('guestRangeOut');
  const rooms = [...document.querySelectorAll('#roomList li')];
  const result = document.getElementById('finderResult');
  const summer = BEERGARDEN_MONTHS.includes(TODAY.getMonth() + 1);

  function update() {
    const g = Number(range.value);
    out.textContent = g;
    let match = null;
    rooms.forEach((li) => {
      const fits = g <= Number(li.dataset.max);
      li.classList.toggle('is-too-small', !fits);
      li.classList.remove('is-match');
      if (fits && !match) match = li;
    });
    if (match) match.classList.add('is-match');
    const name = match ? match.querySelector('strong').textContent : '';
    const seasonal = match && match.dataset.season === 'summer';
    result.textContent = `Für ${g} Gäste passt ${name === 'Saal' ? 'der Saal' : name === 'Biergarten' ? 'der Biergarten' : 'die Kachelofenstube'}` +
      `${seasonal && !summer ? ' (im Sommer)' : ''}. Mit einem Drei-Gänge-Menü ab ${MENU_PER_PERSON} € pro Person rechnen Sie mit etwa ${euro(g * MENU_PER_PERSON)}, Getränke extra.`;
  }
  range.addEventListener('input', update);
  update();
  document.getElementById('feierAsk').addEventListener('click', () => {
    prefillAsk('Feier oder Gesellschaft', `Wir planen eine Feier mit etwa ${range.value} Gästen.\nAnlass: \nWunschtermin: `);
  });
})();

// ---------- Termine (werden aus dem heutigen Datum berechnet, die Seite veraltet nie) ----------
(function events() {
  const list = document.getElementById('events');
  const nthWeekday = (y, m, weekday, n) => { const first = new Date(y, m, 1, 12); return addDays(first, ((weekday - first.getDay() + 7) % 7) + (n - 1) * 7); };
  const firstAdvent = (y) => { const xmas = new Date(y, 11, 25, 12); return addDays(xmas, -((xmas.getDay() || 7) + 21)); };

  function forYear(y) {
    const out = [];
    [9, 10, 11, 0, 1, 2].forEach((m) => {
      const year = m < 6 ? y + 1 : y;
      out.push({ start: nthWeekday(year, m, 4, 1), title: 'Schlachtschüssel', tag: 'jeden ersten Donnerstag', text: 'Kesselfleisch, frische Blut- und Leberwürste, Sauerkraut. Ab 11:30 Uhr, solange der Kessel voll ist.' });
    });
    const kirchweih = addDays(nthWeekday(y, 9, 0, 3), -1);
    out.push({ start: kirchweih, end: addDays(kirchweih, 2), title: 'Kirchweih in Lindenreuth', text: 'Drei Tage Kirchweih mit Küchla, Braten und Blasmusik am Sonntagnachmittag. Am Kirchweihmontag haben wir ausnahmsweise geöffnet.' });
    out.push({ start: new Date(y, 9, 1, 12), end: new Date(y, 10, 15, 12), title: 'Wildwochen', tag: 'bis 15. November', text: 'Reh und Wildschwein aus heimischer Jagd, dazu Serviettenknödel und Preiselbeerbirne.' });
    out.push({ start: nthWeekday(y, 10, 5, 1), title: 'Bockbieranstich', text: 'Das erste Fass Bockbier vom Holzfass. Ab 18 Uhr, mit Brotzeit und Musik vom Stammtisch.' });
    out.push({ start: new Date(y, 10, 11, 12), title: 'Martinsgans', tag: 'auf Vorbestellung', text: 'Ganze Gans für vier Personen oder halbe Gans für zwei, mit Klößen und Blaukraut. Bitte drei Tage vorher bestellen.' });
    const advent2 = addDays(firstAdvent(y), 6);
    out.push({ start: advent2, end: addDays(advent2, 1), title: 'Adventsmarkt im Hof', text: 'Glühwein, Bratwürste vom Rost und Stände aus dem Dorf. Samstag ab 15 Uhr, Sonntag ab 12 Uhr.' });
    out.push({ start: new Date(y, 11, 31, 12), title: 'Silvestermenü', tag: 'nur mit Reservierung', text: 'Fünf Gänge mit Weinbegleitung, 89 € pro Person. Um Mitternacht stoßen wir gemeinsam im Hof an.' });
    out.push({ start: new Date(y, 0, 7, 12), end: new Date(y, 0, 20, 12), title: 'Betriebsurlaub', text: 'Wir machen Pause und sind ab dem 21. Januar wieder für Sie da.', info: true });
    out.push({ start: new Date(y, 3, 30, 12), title: 'Maibaumaufstellen', text: 'Ab 16 Uhr stellt der Burschenverein den Maibaum auf dem Dorfplatz auf. Wir sorgen für Bier und Bratwürste.' });
    out.push({ start: nthWeekday(y, 4, 6, 1), title: 'Biergarten-Eröffnung', text: 'Die Kastanien sind grün, die Bänke stehen. Ab 11:30 Uhr bei schönem Wetter.' });
    return out;
  }

  const all = [...forYear(TODAY.getFullYear() - 1), ...forYear(TODAY.getFullYear()), ...forYear(TODAY.getFullYear() + 1)]
    .filter((e) => (e.end || e.start) >= TODAY || sameDay(e.end || e.start, TODAY))
    .filter((e) => e.title !== 'Schlachtschüssel' || isOpenDay(e.start))
    .sort((a, b) => a.start - b.start)
    .filter((e, i, arr) => arr.findIndex((x) => x.title === e.title) === i)
    .slice(0, 6);

  all.forEach((ev) => {
    const running = ev.end && ev.start <= TODAY;
    const li = document.createElement('li');
    li.className = 'event';
    const shown = running ? TODAY : ev.start;
    const date = document.createElement('div');
    date.className = 'event-date';
    date.innerHTML = `<span class="event-day">${shown.getDate()}.</span><span class="event-month">${MONTHS[shown.getMonth()].slice(0, 3)} · ${DAY_SHORT[shown.getDay()]}</span>`;
    const body = document.createElement('div');
    const title = document.createElement('h3');
    title.className = 'event-title';
    title.textContent = ev.title;
    const tagText = running ? `läuft bis ${ev.end.getDate()}. ${MONTHS[ev.end.getMonth()]}` : ev.end ? `bis ${fmtDate(ev.end)}` : ev.tag;
    if (tagText) { const tag = document.createElement('span'); tag.className = 'event-tag'; tag.textContent = tagText; title.append(tag); }
    const text = document.createElement('p');
    text.className = 'event-text';
    text.textContent = ev.text;
    body.append(title, text);
    const actions = document.createElement('div');
    actions.className = 'event-actions';
    const cal = document.createElement('button');
    cal.type = 'button';
    cal.textContent = 'In den Kalender';
    cal.addEventListener('click', () => downloadIcs(`${ev.title.toLowerCase().replace(/[^a-zäöüß]+/g, '-')}.ics`, [{ start: ev.start, end: ev.end, allDay: true, title: `${ev.title} – Gasthof Grünlinger`, text: ev.text }]));
    actions.append(cal);
    const target = running ? null : ev.start;
    if (!ev.info && target && Reservation.bookable(target)) {
      const res = document.createElement('button');
      res.type = 'button';
      res.textContent = 'Tisch reservieren';
      res.addEventListener('click', () => Reservation.open(target));
      actions.append(res);
    }
    li.append(date, body, actions);
    list.append(li);
  });
})();

// ---------- Gutschein ----------
(function voucher() {
  const form = document.getElementById('voucherForm');
  const card = document.getElementById('voucher');
  const freeField = document.getElementById('freeAmountField');
  const free = document.getElementById('v-free');
  const to = document.getElementById('v-to');
  const from = document.getElementById('v-from');
  const msg = document.getElementById('v-msg');
  const count = document.getElementById('v-count');
  const code = `Nr. GG-${TODAY.getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  document.getElementById('vCode').textContent = code;

  function amount() {
    const v = form.querySelector('input[name="betrag"]:checked').value;
    if (v !== 'frei') return Number(v);
    const n = Math.round(Number(free.value));
    return n >= 10 && n <= 500 ? n : null;
  }

  function update() {
    const isFree = form.querySelector('input[name="betrag"]:checked').value === 'frei';
    freeField.hidden = !isFree;
    const a = amount();
    document.getElementById('err-v-free').textContent = isFree && a === null ? 'Bitte einen Betrag zwischen 10 und 500 Euro.' : '';
    free.setAttribute('aria-invalid', String(isFree && a === null));
    document.getElementById('vAmount').textContent = a ? euro(a) : '– €';
    document.getElementById('vFor').textContent = to.value.trim() ? `für ${to.value.trim()}` : 'für einen Besuch in unserem Gasthof';
    document.getElementById('vMsg').textContent = msg.value.trim();
    document.getElementById('vFrom').textContent = from.value.trim() ? `von ${from.value.trim()}` : '';
    count.textContent = `(noch ${140 - msg.value.length} Zeichen)`;
    const motif = form.querySelector('input[name="motiv"]:checked').value;
    card.className = `voucher voucher-${motif}`;
  }
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();
  document.getElementById('voucherPrint').addEventListener('click', () => {
    if (amount() === null) { free.focus(); return; }
    printOnly('print-voucher');
  });
})();

// ---------- Kontaktformular ----------
function prefillAsk(topic, text) {
  const select = document.getElementById('a-topic');
  [...select.options].forEach((o) => { if (o.text === topic) select.value = o.value; });
  const msg = document.getElementById('a-msg');
  msg.value = text;
  document.getElementById('kontakt').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  setTimeout(() => document.getElementById('a-name').focus({ preventScroll: true }), reducedMotion ? 0 : 700);
}

(function ask() {
  const form = document.getElementById('askForm');
  const status = document.getElementById('askStatus');
  const fields = { msg: document.getElementById('a-msg'), name: document.getElementById('a-name'), email: document.getElementById('a-email') };
  const set = (id, m, f) => { document.getElementById(id).textContent = m; f.setAttribute('aria-invalid', m ? 'true' : 'false'); return !m; };
  Object.values(fields).forEach((f) => f.addEventListener('input', () => set('err-' + f.id, '', f)));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const checks = [
      set('err-a-msg', fields.msg.value.trim() ? '' : 'Bitte schreiben Sie uns kurz, worum es geht.', fields.msg),
      set('err-a-name', fields.name.value.trim().length > 1 ? '' : 'Bitte geben Sie Ihren Namen an.', fields.name),
      set('err-a-email', /\S+@\S+\.\S+/.test(fields.email.value) ? '' : 'Bitte geben Sie eine gültige E-Mail-Adresse an.', fields.email)
    ];
    const firstBad = [fields.msg, fields.name, fields.email][checks.indexOf(false)];
    if (firstBad) { status.textContent = ''; firstBad.focus(); return; }
    status.textContent = 'Danke! Dies ist ein Beispielprojekt, die Nachricht wurde nicht versendet. Im echten Betrieb antworten wir innerhalb eines Tages.';
    form.reset();
  });
})();

// ---------- Ruhiges Einblenden ----------
(function reveal() {
  const imgs = [...document.querySelectorAll('.reveal-img')];
  if (reducedMotion || !('IntersectionObserver' in window)) { imgs.forEach((el) => el.classList.add('is-visible')); return; }
  const targets = [...document.querySelectorAll('.section-head, .tafel-intro, .haus-text, .coasters li, .event, .calc, .finder, .voucher-wrap, .ask, .kontakt-info, .band-text')];
  document.querySelectorAll('.coasters li').forEach((el, i) => { el.style.transitionDelay = `${i * 90}ms`; });
  targets.forEach((el) => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  [...targets, ...imgs].forEach((el) => io.observe(el));
})();
