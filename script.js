// ===== Intro logo animation =====
(function introAnimation() {
  const overlay = document.getElementById('introOverlay');
  const logoWrap = document.getElementById('introLogoWrap');
  const introLogo = document.getElementById('introLogo');
  const navLogoLink = document.querySelector('.nav-logo');
  const navLogoImg = document.getElementById('navLogoImg');
  if (!overlay || !logoWrap || !introLogo || !navLogoImg) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const forceReplay = new URLSearchParams(location.search).has('intro');
const alreadyPlayed = !forceReplay && sessionStorage.getItem('hwaIntroPlayed') === '1';

  if (reduceMotion || alreadyPlayed) {
    overlay.remove();
    logoWrap.remove();
    sessionStorage.setItem('hwaIntroPlayed', '1');
    return;
  }

  navLogoLink.classList.add('intro-target-hidden');
  document.documentElement.style.overflow = 'hidden';

  function run() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        introLogo.classList.add('intro-visible');
      });
    });

    introLogo.addEventListener('transitionend', function onFadeEnd(e) {
      if (e.propertyName !== 'opacity') return;
      introLogo.removeEventListener('transitionend', onFadeEnd);
      setTimeout(moveToTarget, 480);
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

    introLogo.style.transition = 'transform 1.3s cubic-bezier(0.65, 0, 0.35, 1)';

    // Background wipe startet zeitgleich mit der Logo-Bewegung
    overlay.classList.add('intro-reveal');

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

document.querySelectorAll('.nav-mobile a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    navBurger.setAttribute('aria-expanded', 'false');
  });
});

// ===== Contact form (Formspree) =====
const form = document.getElementById('kontaktForm');
const status = document.getElementById('formStatus');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    status.textContent = 'Wird gesendet …';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        status.textContent = 'Danke! Ihre Anfrage ist angekommen, ich melde mich zeitnah.';
        form.reset();
      } else {
        status.textContent = 'Das hat leider nicht geklappt. Schreiben Sie mir gerne direkt per E-Mail.';
      }
    } catch (err) {
      status.textContent = 'Das hat leider nicht geklappt. Schreiben Sie mir gerne direkt per E-Mail.';
    } finally {
      submitBtn.disabled = false;
    }
  });
}
// ===== Back to top =====
(function backToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 600) {
      btn.classList.add('is-visible');
    } else {
      btn.classList.remove('is-visible');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
// ===== Hero-Textrotation =====
(function heroRotate() {
  const el = document.getElementById('heroRotate');
  if (!el) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const phrases = ['Vereine', 'Handwerker', 'Gastronomen','Vermieter','Friseure', 'Beauty-Studios','Werkstätten','Bäckereien','Ladenbesitzer','Selbstständige','Kindergärten'];
  let i = 0;

  setInterval(() => {
  el.classList.add('is-fading');
  setTimeout(() => {
    i = (i + 1) % phrases.length;
    el.textContent = phrases[i];
    el.classList.remove('is-fading');
  }, 600);
}, 4200);
})();
