/* Marlene Vogt Friseur – Beispielprojekt von HWA */

// Öffnungszeiten: Wochentag (0 = Sonntag) → [öffnet, schließt] in Minuten
const HOURS = { 2: [510, 1080], 3: [510, 1080], 4: [510, 1200], 5: [510, 1080], 6: [480, 780] };
const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

// Die Klassen js und motion setzt schon ein kleines Skript im <head>, damit nichts springt
const root = document.documentElement;
const time = (m) => (m % 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}` : String(m / 60));

// Kopfzeile bekommt beim Scrollen eine feine Linie
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
    text.textContent = `Heute geöffnet bis ${time(today[1])} Uhr`;
  } else if (today && min < today[0]) {
    text.textContent = `Heute ab ${time(today[0])} Uhr geöffnet`;
  } else {
    let d = (day + 1) % 7;
    while (!HOURS[d]) d = (d + 1) % 7;
    const when = d === (day + 1) % 7 ? 'Morgen' : `Am ${DAYS[d]}`;
    text.textContent = `${when} ab ${time(HOURS[d][0])} Uhr geöffnet`;
  }
  el.classList.add('is-ready');
})();

// Damenpreise je Haarlänge
(function prices() {
  const buttons = [...document.querySelectorAll('.length button')];
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      document.querySelectorAll('[data-preis]').forEach((p) => {
        p.textContent = `${p.dataset.preis.split(',')[button.dataset.laenge]} €`;
        p.classList.remove('is-changing');
        void p.offsetWidth;
        p.classList.add('is-changing');
      });
    });
  });
})();

// Terminanfrage als Satz: nächste Öffnungstage zur Auswahl, abends nur donnerstags
(function termin() {
  const form = document.getElementById('terminForm');
  const tag = document.getElementById('tag');
  const zeit = document.getElementById('zeit');
  const abend = zeit.querySelector('option[value="abends"]');
  const success = document.getElementById('terminSuccess');

  const d = new Date();
  d.setHours(12, 0, 0, 0);
  const options = [];
  while (options.length < 10) {
    d.setDate(d.getDate() + 1);
    if (!HOURS[d.getDay()]) continue;
    const o = document.createElement('option');
    o.value = `am ${DAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
    o.textContent = `am ${DAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()].slice(0, 3)}.`;
    o.dataset.day = d.getDay();
    options.push(o);
  }
  tag.prepend(...options);
  tag.selectedIndex = 0;

  // Auswahlfelder im Satz so breit wie der gewählte Text, damit der Satz geschlossen wirkt
  const measure = document.createElement('span');
  measure.setAttribute('aria-hidden', 'true');
  measure.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;left:-9999px;top:0';
  form.querySelector('.sentence').append(measure);
  const fit = () => form.querySelectorAll('.sentence select').forEach((s) => {
    const cs = getComputedStyle(s);
    measure.style.font = cs.font;
    measure.textContent = s.selectedOptions[0].textContent;
    s.style.width = `${Math.ceil(measure.getBoundingClientRect().width + parseFloat(cs.paddingRight)) + 4}px`;
  });
  form.addEventListener('change', fit);
  window.addEventListener('resize', fit);
  document.fonts?.ready.then(fit);

  const updateAbend = () => {
    const day = tag.selectedOptions[0].dataset.day;
    // "nächste Woche" und "so bald wie möglich" lassen den Abend offen
    abend.disabled = day !== undefined && day !== '4';
    abend.textContent = abend.disabled ? 'abends (nur Do)' : 'abends';
    if (abend.disabled && zeit.value === 'abends') zeit.selectedIndex = 0;
  };
  tag.addEventListener('change', () => { updateAbend(); fit(); });
  updateAbend();
  fit();

  const setError = (field, message) => {
    const err = document.getElementById(`${field.id}-error`);
    err.textContent = message;
    err.hidden = !message;
    field.setAttribute('aria-invalid', String(Boolean(message)));
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    const tel = form.elements.telefon.value.trim();
    setError(form.elements.name, name ? '' : 'Bitte nennen Sie uns Ihren Namen.');
    setError(form.elements.telefon, tel.replace(/\D/g, '').length >= 6 ? '' : 'Bitte eine Telefonnummer, damit wir zurückrufen können.');
    const invalid = form.querySelector('[aria-invalid="true"]');
    if (invalid) { invalid.focus(); return; }

    const leistung = form.elements.leistung.value;
    const wann = tag.value;
    document.getElementById('successTitle').textContent = `Danke, ${name.split(' ')[0]}.`;
    document.getElementById('successText').textContent = `Wir rufen Sie unter ${tel} zurück und finden einen Termin für ${leistung}, ${wann}, ${zeit.value}.`;
    form.hidden = true;
    success.hidden = false;
    success.focus();
  });

  document.getElementById('terminRestart').addEventListener('click', () => {
    form.reset();
    tag.selectedIndex = 0;
    updateAbend();
    success.hidden = true;
    form.hidden = false;
    fit();
    form.elements.leistung.focus();
  });
})();

// Einblenden beim Scrollen
(function reveal() {
  const targets = document.querySelectorAll('.reveal, .img-reveal');
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
  }, { rootMargin: '0px 0px -6% 0px' });
  targets.forEach((el) => io.observe(el));
})();
