(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Menú móvil ---------- */
  const toggle = $('.nav-toggle');
  const menu = $('.nav-links');
  const setMenu = open => {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Progreso de scroll + navbar ---------- */
  const bar = $('.progress');
  const nav = $('.navbar');
  const onScroll = () => {
    const max = root.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    nav.classList.toggle('scrolled', scrollY > 20);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Enlace activo según sección ---------- */
  const spy = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    $$('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));

  /* ---------- Aparición al hacer scroll ---------- */
  const reveal = new IntersectionObserver((entries, obs) => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    obs.unobserve(e.target);
  }), { threshold: 0.12 });
  $$('.reveal').forEach(el => {
    const i = [...el.parentElement.children].indexOf(el);
    el.style.setProperty('--d', Math.min(i, 5) * 80 + 'ms');
    reveal.observe(el);
  });

  /* ---------- Glitch del nombre al cargar ---------- */
  const h1 = $('.glitch');
  if (h1 && !reduce) {
    h1.classList.add('once');
    setTimeout(() => h1.classList.remove('once'), 900);
  }

  /* ---------- Máquina de escribir ---------- */
  const out = $('#type');
  const phrases = [
    'Desarrollador de Aplicaciones y Videojuegos',
    'Juegos 2D con alma retro',
    'Kotlin · C# · JavaScript'
  ];
  if (out && !reduce) {
    let p = 0, c = 0, del = false;
    const tick = () => {
      const t = phrases[p];
      c += del ? -1 : 1;
      out.textContent = t.slice(0, c);
      let wait = del ? 26 : 55;
      if (!del && c === t.length) { del = true; wait = 1800; }
      else if (del && c === 0) { del = false; p = (p + 1) % phrases.length; wait = 350; }
      setTimeout(tick, wait);
    };
    setTimeout(tick, 2200);
  }

  /* ---------- Cursor personalizado + estela ---------- */
  if (fine) {
    root.classList.add('has-cursor');
    const dot = Object.assign(document.createElement('div'), { className: 'cursor-dot' });
    const ring = Object.assign(document.createElement('div'), { className: 'cursor-ring' });
    document.body.append(ring, dot);

    let x = 0, y = 0, rx = 0, ry = 0, tx = 0, ty = 0, seen = false, flip = false;

    addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY;
      if (!seen) { rx = tx = x; ry = ty = y; seen = true; root.classList.add('cursor-on'); }
      ring.classList.toggle('link', !!e.target.closest('a, button, .project-card'));
      if (!reduce && Math.hypot(x - tx, y - ty) > 18) {
        tx = x; ty = y;
        const t = document.createElement('div');
        t.className = 'trail';
        t.style.left = x - 3 + 'px';
        t.style.top = y - 3 + 'px';
        t.style.background = (flip = !flip) ? 'var(--accent)' : 'var(--accent-2)';
        t.style.setProperty('--dx', (Math.random() * 20 - 10).toFixed(1) + 'px');
        t.style.setProperty('--dy', (8 + Math.random() * 16).toFixed(1) + 'px');
        t.addEventListener('animationend', () => t.remove());
        document.body.append(t);
      }
    }, { passive: true });

    addEventListener('pointerdown', () => ring.classList.add('down'));
    addEventListener('pointerup', () => ring.classList.remove('down'));
    root.addEventListener('mouseleave', () => root.classList.remove('cursor-on'));
    root.addEventListener('mouseenter', () => seen && root.classList.add('cursor-on'));

    (function loop() {
      const k = reduce ? 1 : 0.18;
      rx += (x - rx) * k;
      ry += (y - ry) * k;
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Inclinación 3D + brillo en tarjetas ---------- */
  if (fine && !reduce) {
    $$('.project-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((px - 0.5) * 10).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - py) * 10).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('--rx');
        card.style.removeProperty('--ry');
      });
    });
  }

  /* ---------- Fondo del hero: red de partículas que reacciona al ratón ---------- */
  const cv = $('#fx');
  if (cv) {
    const ctx = cv.getContext('2d');
    const hero = $('.hero');
    const mouse = { x: -999, y: -999 };
    const LINK = 110;
    let w = 0, h = 0, pts = [], raf = 0, visible = true;
    let accent = '#00e5ff', accent2 = '#ff3ea5';

    const readColors = () => {
      const s = getComputedStyle(root);
      accent = s.getPropertyValue('--accent').trim() || accent;
      accent2 = s.getPropertyValue('--accent-2').trim() || accent2;
    };

    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(90, Math.floor((w * h) / 16000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        s: Math.random() < 0.15 ? 4 : 2
      }));
    };

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        if (!reduce) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < 110 && d > 0) { p.x += (dx / d) * 1.2; p.y += (dy / d) * 1.2; }
        }
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = p.s === 4 ? accent2 : accent;
        ctx.fillRect(p.x | 0, p.y | 0, p.s, p.s);
      }
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            ctx.globalAlpha = (1 - d / LINK) * 0.25;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (dm < 160) {
          ctx.globalAlpha = (1 - dm / 160) * 0.6;
          ctx.strokeStyle = accent2;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          ctx.strokeStyle = accent;
        }
      }
      ctx.globalAlpha = 1;
    };

    const frame = () => {
      raf = 0;
      render();
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    };

    readColors(); size(); render();
    if (!reduce) raf = requestAnimationFrame(frame);

    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf && !reduce) raf = requestAnimationFrame(frame);
    }).observe(cv);

    hero.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });

    let t;
    addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { size(); if (reduce) render(); }, 150); });
    addEventListener('themechange', () => { readColors(); if (reduce) render(); });
  }

  /* ---------- Easter egg: código Konami → modo arcade ---------- */
  const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  const toast = $('#toast');
  let pos = 0, toastTimer;
  addEventListener('keydown', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === seq[pos] ? pos + 1 : (k === seq[0] ? 1 : 0);
    if (pos !== seq.length) return;
    pos = 0;
    const on = root.classList.toggle('arcade');
    dispatchEvent(new Event('themechange'));
    toast.textContent = on ? 'Modo arcade activado' : 'Modo arcade desactivado';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  });
})();
