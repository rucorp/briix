/* ============================================================
   BRIIX — landing interactions
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Header shadow on scroll ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav (smooth-scroll anchors only) ---------- */
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.style.display === 'flex';
      nav.style.display = open ? '' : 'flex';
      nav.style.position = 'absolute';
      nav.style.top = 'var(--header-h)';
      nav.style.left = '0';
      nav.style.right = '0';
      nav.style.flexDirection = 'column';
      nav.style.background = '#fff';
      nav.style.borderBottom = '1px solid var(--line)';
      nav.style.padding = open ? '' : '12px 16px 18px';
      if (open) nav.removeAttribute('style');
    });
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) nav.removeAttribute('style');
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach((other) => {
        if (other !== item) {
          other.classList.remove('open');
          const oa = other.querySelector('.faq-a');
          if (oa) oa.style.maxHeight = '0px';
        }
      });
      item.classList.toggle('open', !isOpen);
      a.style.maxHeight = isOpen ? '0px' : a.scrollHeight + 'px';
    });
  });

  /* ============================================================
     Hero demo: URL → Brand DNA + 6 posts (simulated preview)
     Palette is derived deterministically from the domain so every
     run feels personal — mirrors the real product's promise.
     ============================================================ */
  const demoForm = document.getElementById('demo-form');
  const demoInput = document.getElementById('demo-url');
  const demoIdle = document.getElementById('demo-idle');
  const demoGen = document.getElementById('demo-gen');
  const demoResult = document.getElementById('demo-result');
  const demoUrlChip = document.getElementById('demo-url-chip');
  const demoDomainOut = document.getElementById('demo-domain');
  const stepsEl = demoGen ? demoGen.querySelectorAll('.gen-step') : [];
  const postsGrid = document.getElementById('demo-posts');
  const brandCardBox = document.getElementById('demo-brand');

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const to = (x) => Math.round(255 * x).toString(16).padStart(2, '0');
    return '#' + to(f(0)) + to(f(8)) + to(f(4));
  }

  function paletteFor(domain) {
    const h = hashStr(domain.toLowerCase());
    const hue = h % 360;
    return {
      primary: hslToHex(hue, 62 + (h % 12), 38),
      secondary: hslToHex((hue + 26) % 360, 55, 56),
      accent: hslToHex((hue + 185) % 360, 72, 58),
      bg: hslToHex(hue, 38, 95),
      text: hslToHex(hue, 30, 16),
    };
  }

  const POSTS = [
    { tag: 'Экспертный', title: '3 ошибки, которые\nделает каждый\nвторой', chip: 'Совет недели', dark: true },
    { tag: 'Кейс', title: 'Как мы закрыли\nпроект за 2 недели', chip: 'Кейс', dark: false },
    { tag: 'Закулисье', title: 'Наша команда\nза работой', chip: 'Изнутри', dark: true },
    { tag: 'Продающий', title: 'Запись\nоткрыта', chip: 'Акция', dark: false },
    { tag: 'FAQ', title: 'Отвечаем\nна главный вопрос', chip: 'FAQ', dark: true },
    { tag: 'Отзывы', title: 'Слова клиентов,\nкоторыми гордимся', chip: 'Отзыв', dark: false },
  ];

  function renderPreview(domain) {
    const p = paletteFor(domain);
    const name = domain.replace(/^(www\.)?/, '').split('.')[0];
    const brandName = name.charAt(0).toUpperCase() + name.slice(1, 12);

    if (brandCardBox) {
      brandCardBox.innerHTML = `
        <div class="bc-top">
          <div class="bc-title">
            <div class="brand-logo-sq" style="background:${p.primary}">${brandName.charAt(0)}</div>
            <div>
              <div class="bc-name">${brandName}</div>
              <div class="bc-desc">Brand DNA · восстановлен по сайту · версия 1</div>
            </div>
          </div>
          <div class="dna-chips"><span class="dna-chip accent">Self-check пройден</span></div>
        </div>
        <div class="dna-chips">
          <span class="dna-chip">Тон: уверенный, дружелюбный</span>
          <span class="dna-chip">Архетип: Помощник</span>
          <span class="dna-chip">Аудитория: малый бизнес</span>
          <span class="dna-chip">Формат: экспертный + кейсы</span>
        </div>
        <div class="palette-row">
          <span class="sw" style="background:${p.primary}"></span>
          <span class="sw" style="background:${p.secondary}"></span>
          <span class="sw" style="background:${p.accent}"></span>
          <span class="sw" style="background:${p.bg};border-color:rgba(23,19,16,.12)"></span>
          <span class="sw" style="background:${p.text}"></span>
          <span class="lbl">Палитра и шрифты извлечены с сайта</span>
        </div>`;
    }

    if (postsGrid) {
      postsGrid.innerHTML = POSTS.map((post, i) => {
        const bg1 = i % 2 === 0 ? p.primary : p.secondary;
        const bg2 = i % 3 === 0 ? p.accent : p.primary;
        const titleDark = post.dark;
        return `
        <article class="post-mini" tabindex="0">
          <div class="pm-canvas">
            <span class="wm">Превью</span>
            <div class="pm-art" style="background:linear-gradient(${140 + i * 23}deg, ${bg1}, ${bg2})">
              <div class="pa-blob" style="width:70px;height:70px;top:${-12 + i * 4}px;right:${-16 + i * 3}px;background:rgba(255,255,255,.22)"></div>
              <div class="pa-blob" style="width:44px;height:44px;bottom:${28 + i * 2}px;left:${-10}px;background:rgba(255,255,255,.14)"></div>
              <span class="pa-chip${titleDark ? ' dark' : ''}">${post.chip}</span>
              <div class="pa-title${titleDark ? ' dark' : ''}">${post.title.replace(/\n/g, '<br>')}</div>
            </div>
          </div>
          <div class="pm-meta">
            <div class="pm-tag">${post.tag}</div>
            <div class="pm-title">Пост ${i + 1} · адаптация под 4 канала</div>
          </div>
        </article>`;
      }).join('');
    }
  }

  function normalizeUrl(raw) {
    let v = (raw || '').trim();
    if (!v) return null;
    v = v.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/\s+/g, '');
    if (!v || v.indexOf('.') === -1 || /\s/.test(v)) return null;
    return v;
  }

  function show(el) {
    if (!el) return;
    el.hidden = false;
  }
  function hide(el) {
    if (!el) return;
    el.hidden = true;
  }

  let running = false;

  function runDemo(domain) {
    if (running) return;
    running = true;

    hide(demoIdle);
    hide(demoResult);
    show(demoGen);
    if (demoUrlChip) demoUrlChip.textContent = domain;
    if (demoDomainOut) demoDomainOut.textContent = domain;

    stepsEl.forEach((s) => {
      s.classList.remove('active', 'done');
    });

    const durations = [850, 900, 850, 950, 1150];
    let t = 350;
    stepsEl.forEach((step, idx) => {
      setTimeout(() => {
        step.classList.add('active');
        if (idx > 0) {
          stepsEl[idx - 1].classList.remove('active');
          stepsEl[idx - 1].classList.add('done');
          const mark = stepsEl[idx - 1].querySelector('.mark');
          if (mark) mark.textContent = '✓';
        }
      }, t);
      t += durations[idx] || 900;
    });

    setTimeout(() => {
      const last = stepsEl[stepsEl.length - 1];
      if (last) {
        last.classList.remove('active');
        last.classList.add('done');
        const mark = last.querySelector('.mark');
        if (mark) mark.textContent = '✓';
      }
      renderPreview(domain);
      hide(demoGen);
      show(demoResult);
      running = false;
    }, t + 250);
  }

  if (demoForm) {
    demoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const domain = normalizeUrl(demoInput && demoInput.value);
      if (!domain) {
        if (demoInput) {
          demoInput.focus();
          const wrap = demoInput.closest('.url-input-wrap');
          if (wrap) {
            wrap.style.borderColor = '#c2410c';
            setTimeout(() => (wrap.style.borderColor = ''), 1200);
          }
        }
        return;
      }
      runDemo(domain);
      const anchor = document.getElementById('demo');
      if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  document.querySelectorAll('[data-try-domain]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const d = btn.getAttribute('data-try-domain');
      if (demoInput) demoInput.value = d;
      runDemo(d);
    });
  });

  const restartBtn = document.getElementById('demo-restart');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      hide(demoGen);
      hide(demoResult);
      show(demoIdle);
      stepsEl.forEach((s) => {
        s.classList.remove('active', 'done');
        const mark = s.querySelector('.mark');
        if (mark) mark.textContent = '';
      });
      if (demoInput) demoInput.focus();
    });
  }

  /* Toast for CTA placeholders (no backend yet) */
  document.querySelectorAll('[data-cta-toast]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (btn.tagName === 'A' && btn.getAttribute('href') && btn.getAttribute('href') !== '#') return;
      e.preventDefault();
      const msg = document.getElementById('toast');
      if (!msg) return;
      msg.hidden = false;
      msg.style.opacity = '1';
      clearTimeout(msg._t);
      msg._t = setTimeout(() => {
        msg.style.opacity = '0';
        setTimeout(() => (msg.hidden = true), 350);
      }, 3200);
    });
  });

  /* ---------- Smooth anchor offset for sticky header ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
})();
