(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const canvas = $('#matrix');
  const ctx = canvas?.getContext('2d', { alpha: true });
  const chars = 'アカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+-<>!?';
  let fontSize = 15;
  let columns = 0;
  let drops = [];
  let matrixFrame = 0;
  let matrixRunning = true;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resizeMatrix() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fontSize = innerWidth < 600 ? 14 : 15;
    columns = Math.ceil(innerWidth / fontSize);
    drops = Array.from({ length: columns }, () => Math.random() * -80);
  }

  function drawMatrix() {
    if (!ctx || !matrixRunning) return;
    ctx.fillStyle = 'rgba(0, 5, 2, 0.12)';
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

    for (let i = 0; i < columns; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;
      const bright = Math.random() > 0.985;
      ctx.fillStyle = bright ? '#b8ffd0' : (Math.random() > 0.72 ? '#20ff68' : '#079c38');
      ctx.globalAlpha = bright ? 0.82 : 0.42;
      ctx.fillText(char, x, y);
      ctx.globalAlpha = 1;
      if (y > innerHeight && Math.random() > 0.975) drops[i] = Math.random() * -25;
      drops[i] += Math.random() > 0.985 ? 0.75 : 0.22;
    }
    matrixFrame = requestAnimationFrame(drawMatrix);
  }

  function setMatrixVisibility() {
    const hidden = document.hidden;
    matrixRunning = !hidden && !reduceMotion;
    if (matrixRunning && !matrixFrame) matrixFrame = requestAnimationFrame(drawMatrix);
    if (!matrixRunning && matrixFrame) {
      cancelAnimationFrame(matrixFrame);
      matrixFrame = 0;
    }
  }

  resizeMatrix();
  if (!reduceMotion) drawMatrix();
  window.addEventListener('resize', resizeMatrix, { passive: true });
  document.addEventListener('visibilitychange', setMatrixVisibility);

  // Preloader: manual entry, no timer and no duplicated question.
  const preloader = $('#preloader');
  const enterSystem = $('#enterSystem');
  enterSystem?.addEventListener('click', () => {
    preloader?.classList.add('hide');
    window.setTimeout(() => preloader?.remove(), 700);
  });

  // Footer year.
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Mobile navigation.
  const menuToggle = $('#menuToggle');
  const mobileMenu = $('#mobileMenu');
  const closeMenu = () => {
    menuToggle?.classList.remove('active');
    menuToggle?.setAttribute('aria-expanded', 'false');
    mobileMenu?.classList.remove('open');
    mobileMenu?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
  };
  menuToggle?.addEventListener('click', () => {
    const open = !mobileMenu?.classList.contains('open');
    menuToggle.classList.toggle('active', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    mobileMenu?.classList.toggle('open', open);
    mobileMenu?.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
  });
  $$('#mobileMenu a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

  // Scroll progress + back-to-top button.
  const progress = $('#progress');
  const backTop = $('#backTop');
  let ticking = false;
  function updateScrollUI() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const ratio = max > 0 ? scrollY / max : 0;
    if (progress) progress.style.width = `${Math.min(100, ratio * 100)}%`;
    backTop?.classList.toggle('show', scrollY > innerHeight * 0.8);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateScrollUI);
      ticking = true;
    }
  }, { passive: true });
  updateScrollUI();
  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  // Reveal-on-scroll. Falls back to visible content if IntersectionObserver is unavailable.
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  // Subtle background parallax. Disabled on touch/reduced-motion for comfort and battery life.
  const bg = $('.bg-image');
  const canParallax = !reduceMotion && matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (bg && canParallax) {
    let px = 0, py = 0, parallaxFrame = 0;
    window.addEventListener('pointermove', event => {
      px = (event.clientX / innerWidth - 0.5) * -5;
      py = (event.clientY / innerHeight - 0.5) * -3;
      if (!parallaxFrame) {
        parallaxFrame = requestAnimationFrame(() => {
          bg.style.transform = `translate(${px}px, ${py}px) scale(1.02)`;
          parallaxFrame = 0;
        });
      }
    }, { passive: true });
  }

  // Lightweight terminal tilt on desktop.
  const tiltCard = $('[data-tilt]');
  if (tiltCard && canParallax) {
    tiltCard.addEventListener('pointermove', event => {
      const rect = tiltCard.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      tiltCard.style.transform = `perspective(800px) rotateY(${x * 7 - 1}deg) rotateX(${y * -5}deg) translateY(-2px)`;
    });
    tiltCard.addEventListener('pointerleave', () => {
      tiltCard.style.transform = '';
    });
  }

  // Make the first FAQ feel predictable: details are native and keyboard accessible.
  $$('.faq summary').forEach(summary => {
    summary.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        summary.parentElement.open = !summary.parentElement.open;
      }
    });
  });
})();
