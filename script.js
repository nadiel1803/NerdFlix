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
  const colorCycleBtn = document.getElementById('colorCycle');
  const rootEl = document.documentElement; // usamos data-theme no <html>

  /* -----------------------
     THEME: init / toggle / persist
     ----------------------- */
  const THEME_KEY = 'nerdflix-theme'; // values: "dark" | "light"
  const ACCENT_KEY = 'nerdflix-accent'; // value: palette index or name

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
     COLOR CYCLE: define paletas e aplica
     ----------------------- */
  const palettes = [
    { name: 'vermelho', accent: '#E42A2A', accentStrong: 'rgba(228,42,42,0.95)', thumbBorder: 'rgba(228,42,42,0.9)' },
    { name: 'azul',     accent: '#2B8BF4', accentStrong: 'rgba(43,139,244,0.95)', thumbBorder: 'rgba(43,139,244,0.9)' },
    { name: 'verde',    accent: '#28C76F', accentStrong: 'rgba(40,199,111,0.95)', thumbBorder: 'rgba(40,199,111,0.9)' },
    { name: 'roxo',     accent: '#8E44FF', accentStrong: 'rgba(142,68,255,0.95)', thumbBorder: 'rgba(142,68,255,0.9)' },
    { name: 'laranja',  accent: '#FF7A2D', accentStrong: 'rgba(255,122,45,0.95)', thumbBorder: 'rgba(255,122,45,0.9)' }
  ];

  // aplica paleta por índice (ou por objeto)
  function applyPalette(indexOrObj) {
    let p;
    if (typeof indexOrObj === 'number') p = palettes[indexOrObj % palettes.length];
    else p = indexOrObj;
    if (!p) return;
    try {
      rootEl.style.setProperty('--accent', p.accent);
      rootEl.style.setProperty('--accent-strong', p.accentStrong);
      rootEl.style.setProperty('--thumb-hover-border', p.thumbBorder);
      localStorage.setItem(ACCENT_KEY, p.name);
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
    applyPalette(0);
  })();

  // cycle to next palette on click
  colorCycleBtn.addEventListener('click', () => {
    // find current name
    const currentName = localStorage.getItem(ACCENT_KEY);
    const idx = palettes.findIndex(p => p.name === currentName);
    const nextIndex = (idx + 1) % palettes.length;
    applyPalette(nextIndex);
    // feedback rápido: pulse
    colorCycleBtn.animate([{ transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 160, easing: 'ease-out' });
    // atualizar título/tooltip pra indicar a paleta aplicada (opcional)
    colorCycleBtn.setAttribute('title', `Paleta: ${palettes[nextIndex].name}`);
  });

  colorCycleBtn.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      colorCycleBtn.click();
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
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    thumbs.forEach(t => {
      const txt = (t.href + ' ' + (t.dataset.title || '') + ' ' + (t.querySelector('img')?.alt || '')).toLowerCase();
      t.style.display = txt.includes(q) ? '' : 'none';
    });
  });

  // 3) Toggle de tamanho das thumbs
  toggleSizeBtn.addEventListener('click', () => {
    body.classList.toggle('large-thumbs');
    toggleSizeBtn.textContent = body.classList.contains('large-thumbs') ? 'Thumbs menores' : 'Alternar tamanho das thumbs';
  });

  // Accessibility: allow Esc to stop video (remove src)
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      player.src = ''; // para parar o vídeo
    }
  });
});
