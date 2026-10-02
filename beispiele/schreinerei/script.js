// ===== JavaScript aktiv (für Einblendungen) =====
document.documentElement.classList.add('js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== Header: Linie beim Scrollen, aktiver Menüpunkt =====
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const navLinks = [...document.querySelectorAll('.main-nav a:not(.nav-cta)')];
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-active', !!entry.target.id && a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main > section').forEach((section) => sectionObserver.observe(section));
}

// ===== Mobiles Menü =====
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');
const navLabel = navToggle.querySelector('.nav-toggle-label');

function setMenu(open) {
  mainNav.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  navLabel.textContent = open ? 'Schließen' : 'Menü';
}
navToggle.addEventListener('click', () => setMenu(!mainNav.classList.contains('is-open')));
mainNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mainNav.classList.contains('is-open')) { setMenu(false); navToggle.focus(); }
});

// ===== Leistungen: Bildvorschau folgt dem Mauszeiger =====
(function servicePreview() {
  const preview = document.querySelector('.service-preview');
  const list = document.querySelector('.services');
  if (!preview || !list || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const img = preview.querySelector('img');
  let x = 0, y = 0, tx = 0, ty = 0, running = false;

  // Bilder vorladen, damit beim Wechsel nichts flackert
  list.querySelectorAll('[data-preview]').forEach((a) => { const i = new Image(); i.src = a.dataset.preview; });

  function loop() {
    x += (tx - x) * (reducedMotion ? 1 : 0.16);
    y += (ty - y) * (reducedMotion ? 1 : 0.16);
    preview.style.setProperty('--x', x + 'px');
    preview.style.setProperty('--y', y + 'px');
    if (running) requestAnimationFrame(loop);
  }
  list.addEventListener('mousemove', (e) => {
    tx = e.clientX + 32;
    ty = e.clientY - preview.offsetHeight / 2;
    if (!running) { running = true; x = tx; y = ty; requestAnimationFrame(loop); }
  });
  list.querySelectorAll('.service').forEach((a) => {
    a.addEventListener('mouseenter', () => { img.src = a.dataset.preview; preview.classList.add('is-active'); });
  });
  list.addEventListener('mouseleave', () => { preview.classList.remove('is-active'); running = false; });
})();

// ===== Projektdetails im Dialog =====
(function projects() {
  const dialog = document.getElementById('projectDialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const order = [...document.querySelectorAll('[data-project]')].map((el) => el.dataset.project);
  const img = document.getElementById('dialogImg');
  const meta = document.getElementById('dialogMeta');
  const title = document.getElementById('dialogTitle');
  const content = document.getElementById('dialogContent');
  let current = null;
  let opener = null;

  function fill(id) {
    const article = document.querySelector(`[data-project="${id}"]`);
    if (!article) return;
    current = id;
    const source = article.querySelector('.work-image img');
    img.src = source.getAttribute('src');
    img.alt = source.alt;
    img.width = source.width;
    img.height = source.height;
    meta.textContent = article.querySelector('.work-meta').textContent;
    title.textContent = article.querySelector('h3').textContent;
    content.innerHTML = article.querySelector('.work-detail').innerHTML;
    dialog.querySelector('.dialog-body').scrollTop = 0;
  }

  function open(id, trigger) {
    opener = trigger || document.activeElement;
    fill(id);
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('dialog-open');
  }

  function step(dir) {
    const i = order.indexOf(current);
    fill(order[(i + dir + order.length) % order.length]);
  }

  document.querySelectorAll('[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => open(btn.dataset.open, btn));
  });
  document.getElementById('dialogClose').addEventListener('click', () => dialog.close());
  document.getElementById('dialogNext').addEventListener('click', () => step(1));
  document.getElementById('dialogPrev').addEventListener('click', () => step(-1));
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });
  // Klick auf den abgedunkelten Hintergrund schließt den Dialog
  dialog.addEventListener('click', (e) => {
    const r = dialog.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (opener && document.contains(opener)) opener.focus();
  });
})();

// ===== Holzarten (Reiter) =====
(function woods() {
  const tabs = [...document.querySelectorAll('.woods-tabs [role="tab"]')];
  if (!tabs.length) return;
  function select(tab, focus) {
    tabs.forEach((t) => {
      const active = t === tab;
      t.setAttribute('aria-selected', active ? 'true' : 'false');
      t.tabIndex = active ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); select(next, true); }
    });
  });
})();

// ===== Anfrage in drei Schritten (Demo: es wird nichts versendet) =====
(function anfrage() {
  const form = document.getElementById('anfrageForm');
  if (!form) return;
  const steps = [...form.querySelectorAll('.step')];
  const progress = [...document.querySelectorAll('#progress li')];
  const success = document.getElementById('formSuccess');
  const summary = document.getElementById('summary');
  const nachricht = form.nachricht;
  const nachrichtLabel = document.getElementById('nachricht-label');
  const step2Legend = document.getElementById('step2-legend');
  const telefonOptional = document.getElementById('telefon-optional');
  const nameField = document.getElementById('name');
  const STORE = 'kuehlbrandt-anfrage';
  let current = 1;

  const texts = {
    'Küche': ['Erzählen Sie uns von Ihrem Vorhaben', 'Ihr Vorhaben', 'z. B. Küche für ein Haus aus den Siebzigern, Raum etwa 4 × 3,5 m, gern mit Insel. Die Geräte sind teilweise schon vorhanden.'],
    'Einbaumöbel': ['Erzählen Sie uns von Ihrem Vorhaben', 'Ihr Vorhaben', 'z. B. Einbauschrank unter der Dachschräge, etwa 4 m breit, Altbau mit schiefen Wänden.'],
    'Treppe / Innenausbau': ['Erzählen Sie uns von Ihrem Vorhaben', 'Ihr Vorhaben', 'z. B. neue Treppe im Bestand, Geschosshöhe etwa 2,70 m. Die alte Treppe soll raus.'],
    'Tisch / Einzelstück': ['Erzählen Sie uns von Ihrem Vorhaben', 'Ihr Vorhaben', 'z. B. Esstisch für acht Personen, gern Nussbaum, etwa 2,40 m lang.'],
    'Bewerbung': ['Erzählen Sie uns von sich', 'Ein paar Sätze zu Ihnen', 'Was machen Sie gerade, und was interessiert Sie an der Arbeit bei uns? Lebenslauf und Zeugnisse können Sie im Anschluss per E-Mail schicken.'],
    'Etwas anderes': ['Erzählen Sie uns von Ihrem Vorhaben', 'Ihr Vorhaben', 'Beschreiben Sie kurz, worum es geht.']
  };

  const projekt = () => (form.querySelector('input[name="projekt"]:checked') || {}).value || '';
  const viaPhone = () => (form.querySelector('input[name="rueckmeldung"]:checked') || {}).value === 'Telefon';

  function setError(id, message, field) {
    document.getElementById('err-' + id).textContent = message || '';
    if (field) field.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  }

  function validate(n) {
    let ok = true;
    let first = null;
    const check = (valid, id, message, field, focusEl) => {
      setError(id, valid ? '' : message, field);
      if (!valid) { ok = false; first = first || focusEl || field; }
    };
    if (n === 1) {
      check(!!projekt(), 'projekt', 'Bitte wählen Sie aus, worum es geht.', null, form.querySelector('input[name="projekt"]'));
    }
    if (n === 2) {
      check(nachricht.value.trim().length > 0, 'nachricht', 'Bitte beschreiben Sie Ihr Anliegen in ein paar Worten.', nachricht);
    }
    if (n === 3) {
      check(nameField.value.trim().length > 1, 'name', 'Bitte geben Sie Ihren Namen an.', nameField);
      const email = form.email.value.trim();
      check(email && form.email.checkValidity() && /\S+@\S+\.\S+/.test(email), 'email', 'Bitte geben Sie eine gültige E-Mail-Adresse an.', form.email);
      check(!viaPhone() || form.telefon.value.replace(/\D/g, '').length >= 6, 'telefon', 'Für einen Rückruf brauchen wir Ihre Telefonnummer.', form.telefon);
      check(form.einwilligung.checked, 'einwilligung', 'Bitte bestätigen Sie die Einwilligung.', form.einwilligung);
    }
    if (first) first.focus();
    return ok;
  }

  function applyProjekt() {
    const p = projekt();
    const t = texts[p] || texts['Etwas anderes'];
    step2Legend.textContent = t[0];
    nachrichtLabel.textContent = t[1];
    nachricht.placeholder = t[2];
    form.querySelectorAll('[data-hide-for]').forEach((el) => { el.hidden = el.dataset.hideFor === p; });
  }

  function renderSummary() {
    const p = projekt();
    const rows = [['Anliegen', p]];
    if (p !== 'Bewerbung') {
      rows.push(['Zeitraum', form.zeitraum.value || 'Noch offen']);
      if (form.budget.value) rows.push(['Budget', form.budget.value]);
      if (form.ort.value.trim()) rows.push(['Ort', form.ort.value.trim()]);
    }
    summary.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'summary-head';
    head.innerHTML = '<span>Ihre Angaben bisher</span><button type="button">Ändern</button>';
    head.querySelector('button').addEventListener('click', () => goTo(1));
    const dl = document.createElement('dl');
    rows.forEach(([k, v]) => {
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      dl.append(dt, dd);
    });
    summary.append(head, dl);
  }

  function goTo(n, focus = true) {
    current = n;
    steps.forEach((s) => { s.hidden = Number(s.dataset.step) !== n; });
    progress.forEach((li, i) => {
      li.classList.toggle('is-current', i + 1 === n);
      li.classList.toggle('is-done', i + 1 < n);
      if (i + 1 === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    if (n === 2) applyProjekt();
    if (n === 3) renderSummary();
    if (focus) {
      const legend = steps[n - 1].querySelector('legend');
      legend.focus({ preventScroll: true });
      const top = document.querySelector('.anfrage').getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.6) {
        document.querySelector('.anfrage').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      }
    }
  }

  form.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]') && validate(current)) goTo(current + 1);
    if (e.target.closest('[data-prev]')) goTo(current - 1);
  });

  form.addEventListener('change', (e) => {
    if (e.target.name === 'projekt') { setError('projekt', ''); applyProjekt(); }
    if (e.target.name === 'rueckmeldung') {
      telefonOptional.textContent = viaPhone() ? '' : '(optional)';
      if (!viaPhone()) setError('telefon', '', form.telefon);
    }
    if (e.target.name === 'einwilligung' && e.target.checked) setError('einwilligung', '', e.target);
    save();
  });
  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true') {
      const id = e.target.getAttribute('aria-describedby').replace('err-', '');
      setError(id, '', e.target);
    }
    save();
  });
  // Enter im Textfeld soll nicht vorzeitig absenden
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && current < 3) {
      e.preventDefault();
      if (validate(current)) goTo(current + 1);
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate(3)) return;
    const bewerbung = projekt() === 'Bewerbung';
    document.getElementById('successTitle').textContent = bewerbung ? 'Vielen Dank für Ihre Bewerbung.' : 'Vielen Dank für Ihre Anfrage.';
    const items = success.querySelectorAll('.success-steps li');
    if (bewerbung) {
      items[1].textContent = 'Wir laden Sie zu einem Kennenlernen in die Werkstatt ein.';
      items[2].textContent = 'Wenn Sie möchten, arbeiten Sie danach einen Tag zur Probe mit.';
    } else {
      items[1].textContent = 'Wir vereinbaren einen Termin für Beratung und Aufmaß bei Ihnen vor Ort.';
      items[2].textContent = 'Etwa zwei Wochen später erhalten Sie Entwurf und Festpreis.';
    }
    form.hidden = true;
    document.getElementById('progress').hidden = true;
    success.hidden = false;
    success.focus();
    clear();
  });

  document.getElementById('formRestart').addEventListener('click', () => {
    form.reset();
    form.querySelectorAll('[aria-invalid]').forEach((f) => f.setAttribute('aria-invalid', 'false'));
    telefonOptional.textContent = '(optional)';
    success.hidden = true;
    form.hidden = false;
    document.getElementById('progress').hidden = false;
    goTo(1);
  });

  // Stellenanzeige: Bewerbung vorauswählen und direkt zu Schritt 2
  document.querySelectorAll('.job[data-projekt]').forEach((link) => {
    link.addEventListener('click', () => {
      const radio = form.querySelector(`input[name="projekt"][value="${link.dataset.projekt}"]`);
      if (!radio) return;
      radio.checked = true;
      success.hidden = true; form.hidden = false; document.getElementById('progress').hidden = false;
      goTo(2, false);
      setTimeout(() => nachricht.focus({ preventScroll: true }), 700);
    });
  });

  // Entwurf für die laufende Sitzung merken (nur in diesem Browser)
  function save() {
    try {
      const data = {};
      new FormData(form).forEach((v, k) => { data[k] = v; });
      sessionStorage.setItem(STORE, JSON.stringify(data));
    } catch (err) { /* Speicher nicht verfügbar */ }
  }
  function clear() { try { sessionStorage.removeItem(STORE); } catch (err) { /* egal */ } }
  try {
    const data = JSON.parse(sessionStorage.getItem(STORE) || 'null');
    if (data) {
      Object.entries(data).forEach(([k, v]) => {
        const field = form.elements[k];
        if (!field) return;
        if (field instanceof RadioNodeList) {
          const r = form.querySelector(`input[name="${k}"][value="${CSS.escape(v)}"]`);
          if (r) r.checked = true;
        } else if (field.type === 'checkbox') {
          field.checked = true;
        } else {
          field.value = v;
        }
      });
      telefonOptional.textContent = viaPhone() ? '' : '(optional)';
    }
  } catch (err) { /* nichts wiederherzustellen */ }
})();

// ===== Öffnungsstatus der Ausstellung (Zeit in Deutschland) =====
(function openStatus() {
  const box = document.getElementById('openStatus');
  const text = document.getElementById('openStatusText');
  if (!box || typeof Intl === 'undefined') return;
  // Öffnungszeiten in Minuten ab Mitternacht, 0 = Sonntag
  const hours = { 1: [450, 990], 2: [450, 990], 3: [450, 990], 4: [450, 990], 5: [450, 780] };
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const fmt = (m) => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');

  function update() {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Berlin', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    const get = (t) => (parts.find((p) => p.type === t) || {}).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    const now = Number(get('hour')) * 60 + Number(get('minute'));
    if (day < 0) return;
    const today = hours[day];
    let message;
    let open = false;
    if (today && now >= today[0] && now < today[1]) {
      open = true;
      message = `Ausstellung jetzt geöffnet, bis ${fmt(today[1])} Uhr`;
    } else if (today && now < today[0]) {
      message = `Ausstellung öffnet heute um ${fmt(today[0])} Uhr`;
    } else {
      let d = day, add = 0;
      do { d = (d + 1) % 7; add++; } while (!hours[d]);
      message = `Ausstellung geschlossen, öffnet ${add === 1 ? 'morgen' : 'am ' + days[d]} um ${fmt(hours[d][0])} Uhr`;
    }
    text.textContent = message;
    box.classList.toggle('is-open', open);
    box.hidden = false;
  }
  update();
  setInterval(update, 60000);
})();

// ===== Ruhiges Einblenden beim Scrollen =====
(function reveal() {
  if (reducedMotion || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal-img').forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const groups = ['.timeline li', '.services li', '.steps li', '.jobs li'];
  const singles = '.split-head, .intro-text > *, .karriere-text > :not(.jobs), .work-info, .testimonial, .holz-figure blockquote, .holz-figure figcaption, .woods, .anfrage, .kontakt-card';
  const targets = [...document.querySelectorAll(singles)];
  groups.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el, i) => { el.style.transitionDelay = (i * 90) + 'ms'; targets.push(el); });
  });
  targets.forEach((el) => el.classList.add('reveal'));

  // Bilder sind vor dem Einblenden komplett abgedeckt und zählen dann nicht als sichtbar.
  // Deshalb wird das umgebende Element beobachtet und das Bild darin freigegeben.
  const imageFor = new Map();
  document.querySelectorAll('.reveal-img').forEach((el) => imageFor.set(el.parentElement, el));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      (imageFor.get(entry.target) || entry.target).classList.add('is-visible');
      if (imageFor.has(entry.target) && entry.target.classList.contains('reveal')) entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  targets.forEach((el) => io.observe(el));
  imageFor.forEach((img, parent) => io.observe(parent));
})();
