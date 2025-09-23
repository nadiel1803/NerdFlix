// script.js — carregado com defer no <head>

// Espera o DOM
document.addEventListener('DOMContentLoaded', () => {
  const thumbs = Array.from(document.querySelectorAll('.thumb'));
  const player = document.getElementById('mainPlayer');
  const mainTitle = document.getElementById('main-title');
  const mainDesc = document.getElementById('main-desc');
  const searchInput = document.getElementById('search');
  const toggleSizeBtn = document.getElementById('toggleSize');
  const body = document.body;

  const themeToggleBtn = document.getElementById('themeToggle');
  const openPaletteModalBtn = document.getElementById('openPaletteModal');
  const paletteModal = document.getElementById('paletteModal');
  const paletteListEl = document.getElementById('paletteList');
  const closePaletteModalBtn = document.getElementById('closePaletteModal');
  const applyPaletteBtn = document.getElementById('applyPaletteBtn');
  const resetPaletteBtn = document.getElementById('resetPaletteBtn');
  const rootEl = document.documentElement; // usamos data-theme no <html>

  /* -----------------------
     THEME: init / toggle / persist
     ----------------------- */
  const THEME_KEY = 'nerdflix-theme'; // values: "dark" | "light"
  const ACCENT_KEY = 'nerdflix-accent'; // value: palette name

  function applyTheme(theme) {
    if (theme === 'light') {
      rootEl.setAttribute('data-theme', 'light');
      themeToggleBtn.setAttribute('aria-pressed', 'true');
      themeToggleBtn.querySelector('.label').textContent = 'Escurecer';
    } else {
      rootEl.setAttribute('data-theme', 'dark');
      themeToggleBtn.setAttribute('aria-pressed', 'false');
      themeToggleBtn.querySelector('.label').textContent = 'Clarear';
    }
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  (function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { saved = null; }
    if (saved === 'light' || saved === 'dark') {
      applyTheme(saved);
    } else {
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      applyTheme(prefersLight ? 'light' : 'dark');
    }
  })();

  themeToggleBtn.addEventListener('click', () => {
    const current = rootEl.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
  });

  themeToggleBtn.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      themeToggleBtn.click();
    }
  });

  /* -----------------------
     COLOR PALETTES (source of truth)
     ----------------------- */
  const palettes = [
    { name: 'vermelho', label: 'Vermelho', accent: '#E42A2A', accentStrong: 'rgba(228,42,42,0.95)', thumbBorder: 'rgba(228,42,42,0.9)' },
    { name: 'azul',     label: 'Azul',    accent: '#2B8BF4', accentStrong: 'rgba(43,139,244,0.95)', thumbBorder: 'rgba(43,139,244,0.9)' },
    { name: 'verde',    label: 'Verde',   accent: '#28C76F', accentStrong: 'rgba(40,199,111,0.95)', thumbBorder: 'rgba(40,199,111,0.9)' },
    { name: 'roxo',     label: 'Roxo',    accent: '#8E44FF', accentStrong: 'rgba(142,68,255,0.95)', thumbBorder: 'rgba(142,68,255,0.9)' },
    { name: 'laranja',  label: 'Laranja', accent: '#FF7A2D', accentStrong: 'rgba(255,122,45,0.95)', thumbBorder: 'rgba(255,122,45,0.9)' }
  ];

  // aplica paleta por índice ou por objeto (altera variáveis CSS)
  function applyPaletteByIndex(index) {
    const p = palettes[index % palettes.length];
    applyPalette(p);
  }
  function applyPalette(p) {
    if (!p) return;
    try {
      rootEl.style.setProperty('--accent', p.accent);
      rootEl.style.setProperty('--accent-strong', p.accentStrong);
      rootEl.style.setProperty('--thumb-hover-border', p.thumbBorder);
      localStorage.setItem(ACCENT_KEY, p.name);
      openPaletteModalBtn.setAttribute('title', `Paleta atual: ${p.label}`);
    } catch (e) {}
  }

  // init palette from localStorage (by name)
  (function initPalette() {
    let savedName = null;
    try { savedName = localStorage.getItem(ACCENT_KEY); } catch (e) { savedName = null; }
    if (savedName) {
      const found = palettes.find(p => p.name === savedName);
      if (found) { applyPalette(found); return; }
    }
    // default (index 0 = vermelho)
    applyPalette(palettes[0]);
  })();

  /* -----------------------
     PALETTE MODAL: render + behavior
     ----------------------- */

  let selectedPaletteName = localStorage.getItem(ACCENT_KEY) || palettes[0].name;
  let lastFocusedBeforeModal = null;

  function buildPaletteList() {
    paletteListEl.innerHTML = '';
    palettes.forEach((p, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'palette-card';
      card.setAttribute('role', 'listitem');
      card.setAttribute('data-palette', p.name);
      card.setAttribute('aria-pressed', String(p.name === selectedPaletteName));
      card.tabIndex = 0;

      if (p.name === selectedPaletteName) card.classList.add('selected');

      // swatch
      const sw = document.createElement('span');
      sw.className = 'palette-swatch';
      const sw1 = document.createElement('span'); sw1.className = 'sw1'; sw1.style.background = p.accent;
      const sw2 = document.createElement('span'); sw2.className = 'sw2'; sw2.style.background = p.accentStrong;
      sw.appendChild(sw1); sw.appendChild(sw2);

      // meta
      const meta = document.createElement('div');
      meta.className = 'palette-meta';
      const nameEl = document.createElement('div'); nameEl.className = 'palette-name'; nameEl.textContent = p.label;
      const descEl = document.createElement('div'); descEl.className = 'palette-desc'; descEl.textContent = p.name;
      meta.appendChild(nameEl); meta.appendChild(descEl);

      card.appendChild(sw);
      card.appendChild(meta);

      // click handler: mark selected but don't close automatically (user presses Apply)
      card.addEventListener('click', () => {
        // remove previous selected
        const prev = paletteListEl.querySelector('.palette-card.selected');
        if (prev) { prev.classList.remove('selected'); prev.setAttribute('aria-pressed', 'false'); }
        card.classList.add('selected');
        card.setAttribute('aria-pressed', 'true');
        selectedPaletteName = p.name;
      });

      // keyboard: Enter selects, Arrow keys navigate
      card.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          card.click();
        } else if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
          ev.preventDefault();
          focusNextCard(i);
        } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
          ev.preventDefault();
          focusPrevCard(i);
        }
      });

      paletteListEl.appendChild(card);
    });
  }

  function focusNextCard(currentIndex) {
    const nodes = Array.from(paletteListEl.querySelectorAll('.palette-card'));
    const next = nodes[(currentIndex + 1) % nodes.length];
    next.focus();
  }
  function focusPrevCard(currentIndex) {
    const nodes = Array.from(paletteListEl.querySelectorAll('.palette-card'));
    const prev = nodes[(currentIndex - 1 + nodes.length) % nodes.length];
    prev.focus();
  }

  function openPaletteModal() {
    buildPaletteList();
    lastFocusedBeforeModal = document.activeElement;
    paletteModal.setAttribute('aria-hidden', 'false');
    paletteModal.style.display = 'flex';
    // focus the selected card
    requestAnimationFrame(() => {
      const sel = paletteListEl.querySelector(`.palette-card[data-palette="${selectedPaletteName}"]`) || paletteListEl.querySelector('.palette-card');
      if (sel) sel.focus();
      document.body.style.overflow = 'hidden'; // prevent background scroll
    });
    // trap focus minimally by listening for focus outside
    document.addEventListener('focus', enforceFocus, true);
  }

  function closePaletteModal() {
    paletteModal.setAttribute('aria-hidden', 'true');
    paletteModal.style.display = 'none';
    document.body.style.overflow = '';
    document.removeEventListener('focus', enforceFocus, true);
    if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') {
      lastFocusedBeforeModal.focus();
    } else {
      openPaletteModalBtn.focus();
    }
  }

  function enforceFocus(ev) {
    if (!paletteModal.contains(ev.target)) {
      ev.stopPropagation();
      const sel = paletteListEl.querySelector(`.palette-card[data-palette="${selectedPaletteName}"]`) || paletteListEl.querySelector('.palette-card');
      if (sel) sel.focus();
    }
  }

  // overlay and close button
  paletteModal.addEventListener('click', (ev) => {
    if (ev.target && ev.target.matches('[data-action="close"], .palette-overlay')) {
      closePaletteModal();
    }
  });
  closePaletteModalBtn.addEventListener('click', closePaletteModal);

  // Apply button: actually set the palette and close
  applyPaletteBtn.addEventListener('click', () => {
    const sel = palettes.find(p => p.name === selectedPaletteName) || palettes[0];
    applyPalette(sel);
    closePaletteModal();
  });

  // Reset to default
  resetPaletteBtn.addEventListener('click', () => {
    selectedPaletteName = palettes[0].name;
    applyPalette(palettes[0]);
    buildPaletteList(); // update visuals
  });

  // keyboard: Esc closes modal; Enter handled on cards
  document.addEventListener('keydown', (ev) => {
    if (paletteModal.getAttribute('aria-hidden') === 'false' && ev.key === 'Escape') {
      closePaletteModal();
    }
  });

  openPaletteModalBtn.addEventListener('click', () => {
    openPaletteModal();
  });
  openPaletteModalBtn.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      openPaletteModal();
    }
  });

  /* -----------------------
     EXISTING FEATURES (thumb click, busca, toggle size, Esc)
     ----------------------- */

  // 1) Clicar numa thumb carrega no player (sem abrir nova aba)
  thumbs.forEach(t => {
    t.addEventListener('click', (ev) => {
      ev.preventDefault();
      const src = t.dataset.video;
      // troca src do iframe (mantém autoplay desligado por padrão)
      player.src = src;
      // atualiza título/descrição se existir data-title
      const title = t.dataset.title || t.querySelector('img')?.alt || 'Vídeo';
      mainTitle.textContent = title;
      mainDesc.textContent = ''; // se quiser, pode colocar descrição extra
      // pequeno feedback visual: borda ativa
      thumbs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      // rolar pra topo do player (UX)
      player.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    // também permitir keyboard (Enter)
    t.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        t.click();
      }
    });
  });

  // 2) Busca: filtra thumbs pelos atributos href, alt, data-title
  function filterThumbs(q = '') {
    const ql = (q || '').trim().toLowerCase();
    thumbs.forEach(t => {
      const txt = (t.href + ' ' + (t.dataset.title || '') + ' ' + (t.querySelector('img')?.alt || '')).toLowerCase();
      t.style.display = txt.includes(ql) ? '' : 'none';
    });
  }

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();

    // EASTER EGG trigger: se exatamente 'nerdflix' -> ativa o modo retrô
    if (q === 'nerdflix') {
      // limpa a busca (pra não filtrar thumbs) e ativa o easter egg
      searchInput.value = '';
      filterThumbs('');
      activateRetroMode();
      return;
    }

    // normal filter
    filterThumbs(q);
  });

  // 3) Toggle de tamanho das thumbs
  toggleSizeBtn.addEventListener('click', () => {
    body.classList.toggle('large-thumbs');
    toggleSizeBtn.textContent = body.classList.contains('large-thumbs') ? 'Thumbs menores' : 'Alternar tamanho das thumbs';
  });

  // Accessibility: allow Esc to stop video (remove src) or close modal / retro
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      // if modal open, close modal
      if (paletteModal.getAttribute('aria-hidden') === 'false') {
        closePaletteModal();
        return;
      }
      // if retro mode active, close it first
      if (body.classList.contains('retro-mode')) {
        deactivateRetroMode();
        return;
      }
      // else stop video
      player.src = '';
    }
  });

  /* =========================
     EASTER EGG: RETRO MODE
     ========================= */

  let retroTimeout = null;
  function activateRetroMode() {
    if (body.classList.contains('retro-mode')) {
      // already active -> give a quick pulse and return
      pulseRetroBanner('Já tá no modo retrô!');
      return;
    }
    body.classList.add('retro-mode');
    // show banner
    showRetroBanner();
    // optional: auto-disable after X minutes (here 5 minutes)
    if (retroTimeout) clearTimeout(retroTimeout);
    retroTimeout = setTimeout(() => {
      deactivateRetroMode();
    }, 1000 * 60 * 5);
  }

  function deactivateRetroMode() {
    body.classList.remove('retro-mode');
    removeRetroBanner();
    if (retroTimeout) { clearTimeout(retroTimeout); retroTimeout = null; }
  }

  // create and show banner
  function showRetroBanner() {
    // avoid duplicates
    if (document.querySelector('.retro-banner')) return;
    const banner = document.createElement('div');
    banner.className = 'retro-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML = `
      <div>
        <div class="title">EASTER EGG DESBLOQUEADO!</div>
        <div class="sub">Modo Retrô ativado — bem vindo ao cinema pixel 👾</div>
      </div>
      <div class="hint">Pressione ESC para sair</div>
      <button class="close-retro" aria-label="Fechar modo retrô">✕</button>
    `;
    document.body.appendChild(banner);

    // click on close button
    banner.querySelector('.close-retro').addEventListener('click', () => {
      deactivateRetroMode();
    });

    // clicking banner also toggles off
    banner.addEventListener('click', (ev) => {
      // ignore clicks on the close button (already handled)
      if (ev.target.closest('.close-retro')) return;
      // clicking the banner background toggles off
      deactivateRetroMode();
    });

    // small pulse when user hovers
    banner.addEventListener('mouseenter', () => {
      banner.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-4px) scale(1.02)' }], { duration: 220, easing: 'ease-out' });
    });
  }

  function removeRetroBanner() {
    const b = document.querySelector('.retro-banner');
    if (!b) return;
    b.remove();
  }

  function pulseRetroBanner(msg) {
    // show tiny temporary banner message
    const tmp = document.createElement('div');
    tmp.className = 'retro-banner';
    tmp.style.top = '8%';
    tmp.style.background = 'linear-gradient(90deg, rgba(52,209,255,0.06), rgba(124,255,124,0.02))';
    tmp.innerHTML = `<div><div class="title">${msg}</div></div>`;
    document.body.appendChild(tmp);
    setTimeout(() => tmp.remove(), 1300);
  }

  // Also expose a small quick toggle via console (handy while dev/testing)
  window.__toggleRetro = () => {
    if (body.classList.contains('retro-mode')) deactivateRetroMode();
    else activateRetroMode();
  };

  /* =========================
     END EASTER EGG
     ========================= */

});
