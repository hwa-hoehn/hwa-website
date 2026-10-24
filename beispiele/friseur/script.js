/* Friseur Vogt – Beispielprojekt von HWA */

// Öffnungszeiten: Wochentag (0 = Sonntag) → [öffnet, schließt] in Minuten
const HOURS = { 2: [510, 1080], 3: [510, 1080], 4: [510, 1200], 5: [510, 1080], 6: [480, 780] };
const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const DAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

// Die Klassen js und motion setzt schon ein kleines Skript im <head>, damit nichts springt
const root = document.documentElement;

const time = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

// Kopfzeile bekommt beim Scrollen eine Linie
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Menü am Handy
(function menu() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');
  const set = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Schließen' : 'Menü';
  };
  toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { set(false); toggle.focus(); } });
})();

// Geöffnet oder geschlossen, nach aktueller Uhrzeit
(function openStatus() {
  const el = document.getElementById('openStatus');
  const text = document.getElementById('openStatusText');
  const now = new Date();
  const day = now.getDay();
  const min = now.getHours() * 60 + now.getMinutes();
  const today = HOURS[day];
  document.querySelector(`#hours tr[data-day="${day}"]`)?.classList.add('is-today');

  if (today && min >= today[0] && min < today[1]) {
    text.textContent = `Jetzt geöffnet, heute bis ${time(today[1])} Uhr`;
    el.classList.add('is-open');
  } else if (today && min < today[0]) {
    text.textContent = `Geschlossen, öffnet heute um ${time(today[0])} Uhr`;
  } else {
    let d = (day + 1) % 7;
    while (!HOURS[d]) d = (d + 1) % 7;
    const when = d === (day + 1) % 7 ? 'morgen' : `am ${DAYS[d]}`;
    text.textContent = `Geschlossen, öffnet ${when} um ${time(HOURS[d][0])} Uhr`;
  }
  el.classList.add('is-ready');
})();

// Preisliste: Reiter und Haarlänge
(function prices() {
  const tabs = [...document.querySelectorAll('.price-tabs [role="tab"]')];
  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const active = t === tab;
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', (e) => {
      const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select(tabs[(next + tabs.length) % tabs.length], true);
    });
  });
  select(tabs[0], false);
  root.classList.add('tabs-ready');

  const index = { kurz: 0, mittel: 1, lang: 2 };
  document.querySelectorAll('input[name="laenge"]').forEach((input) => {
    input.addEventListener('change', () => {
      document.querySelectorAll('[data-preis]').forEach((p) => {
        p.textContent = `${p.dataset.preis.split(',')[index[input.value]]} €`;
        p.classList.remove('is-changing');
        void p.offsetWidth;
        p.classList.add('is-changing');
      });
    });
  });
})();

// Terminanfrage: nächste Öffnungstage als Auswahl, Abend nur donnerstags
(function termin() {
  const form = document.getElementById('terminForm');
  const chips = document.getElementById('tagChips');
  const abend = document.querySelector('#abendChip input');
  const success = document.getElementById('terminSuccess');
  const summary = document.getElementById('summary');

  const days = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  while (days.length < 8) {
    d.setDate(d.getDate() + 1);
    if (HOURS[d.getDay()]) days.push(new Date(d));
  }
  chips.innerHTML = '';
  days.forEach((day, i) => {
    const label = document.createElement('label');
    const value = `${DAYS[day.getDay()]}, ${day.getDate()}.${day.getMonth() + 1}.`;
    label.innerHTML = `<input type="radio" name="tag" value="${value}" data-day="${day.getDay()}"${i === 0 ? ' checked' : ''}><span>${DAYS_SHORT[day.getDay()]} ${day.getDate()}.${day.getMonth() + 1}.</span>`;
    label.querySelector('input').setAttribute('aria-label', value);
    chips.append(label);
  });

  const updateAbend = () => {
    const tag = form.querySelector('input[name="tag"]:checked');
    const thursday = tag && tag.dataset.day === '4';
    abend.disabled = !thursday;
    if (!thursday && abend.checked) form.querySelector('input[name="zeit"]').checked = true;
  };
  chips.addEventListener('change', updateAbend);
  updateAbend();

  const setError = (field, message) => {
    const err = document.getElementById(`${field.id}-error`);
    err.textContent = message;
    err.hidden = !message;
    field.setAttribute('aria-invalid', String(Boolean(message)));
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    const tel = form.telefon.value.trim();
    setError(form.elements.name, name ? '' : 'Bitte geben Sie Ihren Namen an.');
    setError(form.telefon, /\d{5,}/.test(tel.replace(/\D/g, '')) ? '' : 'Bitte geben Sie eine Telefonnummer an, damit wir zurückrufen können.');
    const invalid = form.querySelector('[aria-invalid="true"]');
    if (invalid) { invalid.focus(); return; }

    const rows = [
      ['Leistung', form.querySelector('input[name="leistung"]:checked').value],
      ['Wunschtermin', `${form.querySelector('input[name="tag"]:checked')?.value || form.querySelector('input[name="tag"]').value || 'egal'}, ${form.querySelector('input[name="zeit"]:checked').value}`],
      ['Name', name],
      ['Telefon', tel],
    ];
    if (form.neu.checked) rows.push(['Neu bei uns', 'ja, mehr Zeit für Beratung']);
    if (form.notiz.value.trim()) rows.push(['Notiz', form.notiz.value.trim()]);
    summary.innerHTML = '';
    rows.forEach(([k, v]) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = k;
      dd.textContent = v;
      row.append(dt, dd);
      summary.append(row);
    });
    document.getElementById('successTitle').textContent = `Danke, ${name.split(' ')[0]}.`;
    form.hidden = true;
    success.hidden = false;
    success.focus();
  });

  document.getElementById('terminRestart').addEventListener('click', () => {
    form.reset();
    updateAbend();
    success.hidden = true;
    form.hidden = false;
    form.querySelector('input').focus();
  });
})();

// Einblenden beim Scrollen
(function reveal() {
  const targets = document.querySelectorAll('.reveal, .scheitel');
  if (!root.classList.contains('motion')) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  targets.forEach((el) => io.observe(el));
})();
