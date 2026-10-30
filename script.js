// ===== Animationen vorbereiten =====
// .motion schaltet die Ausgangszustände in style.css frei. Ohne JavaScript oder bei reduzierter Bewegung bleibt alles sofort sichtbar.
const motionOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window;
if (motionOk) document.documentElement.classList.add('motion');
const showHero = () => document.documentElement.classList.add('hero-in');

// ===== Intro logo animation =====
(function introAnimation() {
  const overlay = document.getElementById('introOverlay');
  const logoWrap = document.getElementById('introLogoWrap');
  const introLogo = document.getElementById('introLogo');
  const navLogoLink = document.querySelector('.nav-logo');
  const navLogoImg = document.getElementById('navLogoImg');
  if (!overlay || !logoWrap || !introLogo || !navLogoImg) {
    showHero();
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const forceReplay = new URLSearchParams(location.search).has('intro');
const alreadyPlayed = !forceReplay && sessionStorage.getItem('hwaIntroPlayed') === '1';

  if (reduceMotion || alreadyPlayed) {
    overlay.remove();
    logoWrap.remove();
    sessionStorage.setItem('hwaIntroPlayed', '1');
    // Zwei Frames warten, damit der Ausgangszustand einmal gezeichnet ist und der Übergang läuft
    requestAnimationFrame(() => requestAnimationFrame(showHero));
    return;
  }

  navLogoLink.classList.add('intro-target-hidden');
  document.documentElement.style.overflow = 'hidden';

  // Notbremse: Falls ein Übergang nicht endet, gibt die Seite sich nach 4,5 s frei
  const failsafe = setTimeout(() => {
    overlay.remove();
    logoWrap.remove();
    navLogoLink.classList.remove('intro-target-hidden');
    document.documentElement.style.overflow = '';
    showHero();
  }, 4500);

  function run() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        introLogo.classList.add('intro-visible');
      });
    });

    introLogo.addEventListener('transitionend', function onFadeEnd(e) {
      if (e.propertyName !== 'opacity') return;
      introLogo.removeEventListener('transitionend', onFadeEnd);
      setTimeout(moveToTarget, 50);
    });
  }

  function moveToTarget() {
    const from = introLogo.getBoundingClientRect();
    const to = navLogoImg.getBoundingClientRect();

    const targetHeight = to.height || 26;
    const scale = targetHeight / from.height;

    const fromCenterX = from.left + from.width / 2;
    const fromCenterY = from.top + from.height / 2;
    const toCenterX = to.left + to.width / 2;
    const toCenterY = to.top + to.height / 2;

    const deltaX = toCenterX - fromCenterX;
    const deltaY = toCenterY - fromCenterY;

    introLogo.style.transition = 'transform 0.6s cubic-bezier(0.65, 0, 0.35, 1)';

    // Background wipe startet zeitgleich mit der Logo-Bewegung, der Hero fährt darunter herein
    overlay.classList.add('intro-reveal');
    showHero();

    requestAnimationFrame(() => {
      introLogo.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scale})`;
    });

    introLogo.addEventListener('transitionend', function onMoveEnd(e) {
      if (e.propertyName !== 'transform') return;
      introLogo.removeEventListener('transitionend', onMoveEnd);
      navLogoLink.classList.remove('intro-target-hidden');
      logoWrap.style.opacity = '0';
      document.documentElement.style.overflow = '';
    });

    overlay.addEventListener('transitionend', function onWipeEnd(e) {
      if (e.propertyName !== 'clip-path') return;
      overlay.removeEventListener('transitionend', onWipeEnd);
      clearTimeout(failsafe);
      overlay.remove();
      logoWrap.remove();
    });
  }

  sessionStorage.setItem('hwaIntroPlayed', '1');

  if (document.readyState === 'complete') {
    run();
  } else {
    window.addEventListener('load', run);
  }
})();

// ===== Mobile nav =====
const nav = document.getElementById('nav');
const navBurger = document.getElementById('navBurger');

navBurger.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  navBurger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

const closeNav = () => {
  nav.classList.remove('is-open');
  navBurger.setAttribute('aria-expanded', 'false');
};
document.querySelectorAll('.nav-mobile a').forEach(link => link.addEventListener('click', closeNav));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('is-open')) {
    closeNav();
    navBurger.focus();
  }
});

// ===== Contact form (Formspree) =====
const form = document.getElementById('kontaktForm');
const status = document.getElementById('formStatus');

if (form) {
  // Fehlermeldung mit direkten Kontaktwegen, damit niemand ohne Ausweg dasteht
  const showError = (text) => {
    const mail = document.createElement('a');
    mail.href = 'mailto:kontakt@hwa-hoehn.de';
    mail.textContent = 'kontakt@hwa-hoehn.de';
    const tel = document.createElement('a');
    tel.href = 'tel:+491706940908';
    tel.textContent = '0170\u00a06940908';
    status.replaceChildren(`${text} Schreiben Sie mir direkt an `, mail, ' oder rufen Sie an: ', tel, '.');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    status.textContent = 'Wird gesendet …';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (res.ok) {
        status.textContent = 'Danke! Ihre Anfrage ist angekommen, ich melde mich zeitnah.';
        form.reset();
      } else {
        showError('Das hat leider nicht geklappt.');
      }
    } catch (err) {
      showError(err.name === 'AbortError' ? 'Die Verbindung hat zu lange gedauert, Ihre Anfrage ist vermutlich nicht angekommen.' : 'Das hat leider nicht geklappt.');
    } finally {
      clearTimeout(timeout);
      submitBtn.disabled = false;
    }
  });
}
// ===== Back to top =====
(function backToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-visible', window.scrollY > 600);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// ===== Herkunft aus Link übernehmen (z. B. ?quelle=flyer vom QR-Code) =====
(function presetQuelle() {
  const select = document.getElementById('quelle');
  if (!select) return;
  if (new URLSearchParams(location.search).get('quelle') === 'flyer') {
    select.value = 'Flyer / persönlicher Besuch';
  }
})();

// ===== Scroll-Animationen =====
(function scrollReveal() {
  if (!motionOk) return;

  // Abschnittstitel in eine Maske legen, damit sie von unten hereinfahren können
  const titles = document.querySelectorAll('.section-title');
  titles.forEach((title) => {
    const line = document.createElement('span');
    const inner = document.createElement('span');
    line.className = 'reveal-line';
    inner.append(...title.childNodes);
    line.append(inner);
    title.append(line);
  });

  const items = document.querySelectorAll([
    '.section-eyebrow', '.status-badge', '.kontakt-sub',
    '.services-grid', '.ablauf-grid > *', '.pricing-grid > *',
    '.portfolio-grid > *', '.portfolio-more-head', '.portfolio-more-grid > *', '.about-photo', '.faq-list', '.kontakt-grid > *',
  ].join(','));
  items.forEach((el) => el.classList.add('reveal'));

  // Gestaffelt wird nur innerhalb dessen, was gleichzeitig ins Bild kommt, sonst warten Karten am Handy unnötig
  const observer = new IntersectionObserver((entries) => {
    entries
      .filter((entry) => entry.isIntersecting)
      .map((entry) => entry.target)
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
      .forEach((el, i) => {
        if (el.classList.contains('reveal')) el.style.setProperty('--i', i);
        el.classList.add('is-in');
        observer.unobserve(el);
      });
  }, { rootMargin: '0px 0px -10% 0px' });

  titles.forEach((el) => observer.observe(el));
  items.forEach((el) => observer.observe(el));
})();

// ===== Handy-Leiste: sichtbar, sobald der Hero weg ist, ausgeblendet am Kontaktformular =====
(function mobileBar() {
  const bar = document.getElementById('mobileBar');
  const hero = document.getElementById('top');
  const kontakt = document.getElementById('kontakt');
  if (!bar || !hero || !kontakt || !('IntersectionObserver' in window)) return;

  let heroVisible = true;
  let kontaktVisible = false;
  const update = () => bar.classList.toggle('is-visible', !heroVisible && !kontaktVisible);

  new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; update(); }).observe(hero);
  new IntersectionObserver(([entry]) => { kontaktVisible = entry.isIntersecting; update(); }, { rootMargin: '0px 0px -30% 0px' }).observe(kontakt);
})();
