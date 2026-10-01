// ===== JavaScript aktiv (für das Einblenden beim Scrollen) =====
document.documentElement.classList.add('js');

// ===== Mobiles Menü =====
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

navToggle.addEventListener('click', () => {
  const open = mainNav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  navToggle.querySelector('.nav-toggle-label').textContent = open ? 'Schließen' : 'Menü';
});

mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.querySelector('.nav-toggle-label').textContent = 'Menü';
  });
});

// ===== Stellenangebot -> Formular mit "Bewerbung" vorbelegen =====
document.querySelectorAll('[data-projekt]').forEach((link) => {
  link.addEventListener('click', () => {
    const radio = document.querySelector(`input[name="projekt"][value="${link.dataset.projekt}"]`);
    if (radio) radio.checked = true;
  });
});

// ===== Anfrageformular (Demo: es wird nichts versendet) =====
const form = document.getElementById('anfrageForm');
const status = document.getElementById('formStatus');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const missing = [];
  if (!form.querySelector('input[name="projekt"]:checked')) missing.push('Worum geht es?');
  if (!form.nachricht.value.trim()) missing.push('Ihr Vorhaben');
  if (!form.name.value.trim()) missing.push('Name');
  if (!form.email.value.trim() || !form.email.checkValidity()) missing.push('E-Mail');

  if (missing.length) {
    status.textContent = 'Bitte noch ausfüllen: ' + missing.join(', ') + '.';
    return;
  }

  status.textContent = 'Vielen Dank! Dies ist ein Beispielprojekt – die Anfrage wurde nicht versendet.';
  form.reset();
});

// ===== Dezentes Einblenden beim Scrollen =====
(function reveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;
  const targets = document.querySelectorAll('.section-head, .service, .work, .testimonial, .holz-figure, .holz-text, .steps li, .job, .karriere-figure');
  targets.forEach((el) => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  targets.forEach((el) => io.observe(el));
})();
