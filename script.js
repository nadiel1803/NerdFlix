// script.js — completo (original + Supabase auth integrado)
// Carregado com defer no <head>

// CONFIGURAÇÕES DO SUPABASE (já com as chaves que você passou)
const SUPABASE_URL = 'https://iqootgumqxwscsrwagpc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlxb290Z3VtcXh3c2NzcndhZ3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzODg4MDQsImV4cCI6MjA3Mzk2NDgwNH0.8GC166Vrjmt4dphVoma49aJ7asmYGhBwXIw0k14BAGM';

// cria cliente Supabase usando o global exposto pelo UMD CDN
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('supabaseClient ok?', !!supabaseClient);

// MAIN: espera o DOM
document.addEventListener('DOMContentLoaded', () => {
  /* =========================
     ELEMENTOS / VARIÁVEIS GLOBAIS
     ========================= */
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

  /* =========================
     THEME: init / toggle / persist
     ========================= */
  const THEME_KEY = 'nerdflix-theme'; // values: "dark" | "light"
  const ACCENT_KEY = 'nerdflix-accent'; // value: palette name

  function applyTheme(theme) {
    if (theme === 'light') {
      rootEl.setAttribute('data-theme', 'light');
      themeToggleBtn.setAttribute('aria-pressed', 'true');
      const lbl = themeToggleBtn.querySelector('.label'); if (lbl) lbl.textContent = 'Escurecer';
    } else {
      rootEl.setAttribute('data-theme', 'dark');
      themeToggleBtn.setAttribute('aria-pressed', 'false');
      const lbl = themeToggleBtn.querySelector('.label'); if (lbl) lbl.textContent = 'Clarear';
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

  if (themeToggleBtn) {
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
  }

  /* =========================
     COLOR PALETTES
     ========================= */
  const palettes = [
    { name: 'vermelho', label: 'Vermelho', accent: '#E42A2A', accentStrong: 'rgba(228,42,42,0.95)', thumbBorder: 'rgba(228,42,42,0.9)' },
    { name: 'azul',     label: 'Azul',    accent: '#2B8BF4', accentStrong: 'rgba(43,139,244,0.95)', thumbBorder: 'rgba(43,139,244,0.9)' },
    { name: 'verde',    label: 'Verde',   accent: '#28C76F', accentStrong: 'rgba(40,199,111,0.95)', thumbBorder: 'rgba(40,199,111,0.9)' },
    { name: 'roxo',     label: 'Roxo',    accent: '#8E44FF', accentStrong: 'rgba(142,68,255,0.95)', thumbBorder: 'rgba(142,68,255,0.9)' },
    { name: 'laranja',  label: 'Laranja', accent: '#FF7A2D', accentStrong: 'rgba(255,122,45,0.95)', thumbBorder: 'rgba(255,122,45,0.9)' }
  ];

  function applyPaletteByIndex(index) { applyPalette(palettes[index % palettes.length]); }
  function applyPalette(p) {
    if (!p) return;
    try {
      rootEl.style.setProperty('--accent', p.accent);
      rootEl.style.setProperty('--accent-strong', p.accentStrong);
      rootEl.style.setProperty('--thumb-hover-border', p.thumbBorder);
      localStorage.setItem(ACCENT_KEY, p.name);
      if (openPaletteModalBtn) openPaletteModalBtn.setAttribute('title', `Paleta atual: ${p.label}`);
    } catch (e) { console.warn('applyPalette error', e); }
  }

  (function initPalette() {
    let savedName = null;
    try { savedName = localStorage.getItem(ACCENT_KEY); } catch (e) { savedName = null; }
    if (savedName) {
      const found = palettes.find(p => p.name === savedName);
      if (found) { applyPalette(found); return; }
    }
    applyPalette(palettes[0]);
  })();

  /* =========================
     PALETTE MODAL: render + behavior
     ========================= */
  let selectedPaletteName = localStorage.getItem(ACCENT_KEY) || palettes[0].name;
  let lastFocusedBeforeModal = null;

  function buildPaletteList() {
    if (!paletteListEl) return;
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

      const sw = document.createElement('span');
      sw.className = 'palette-swatch';
      const sw1 = document.createElement('span'); sw1.className = 'sw1'; sw1.style.background = p.accent;
      const sw2 = document.createElement('span'); sw2.className = 'sw2'; sw2.style.background = p.accentStrong;
      sw.appendChild(sw1); sw.appendChild(sw2);

      const meta = document.createElement('div'); meta.className = 'palette-meta';
      const nameEl = document.createElement('div'); nameEl.className = 'palette-name'; nameEl.textContent = p.label;
      const descEl = document.createElement('div'); descEl.className = 'palette-desc'; descEl.textContent = p.name;
      meta.appendChild(nameEl); meta.appendChild(descEl);

      card.appendChild(sw); card.appendChild(meta);

      card.addEventListener('click', () => {
        const prev = paletteListEl.querySelector('.palette-card.selected');
        if (prev) { prev.classList.remove('selected'); prev.setAttribute('aria-pressed', 'false'); }
        card.classList.add('selected');
        card.setAttribute('aria-pressed', 'true');
        selectedPaletteName = p.name;
      });

      card.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); card.click(); }
        else if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { ev.preventDefault(); focusNextCard(i); }
        else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { ev.preventDefault(); focusPrevCard(i); }
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
    if (!paletteModal) return;
    paletteModal.setAttribute('aria-hidden', 'false');
    paletteModal.style.display = 'flex';
    requestAnimationFrame(() => {
      const sel = paletteListEl.querySelector(`.palette-card[data-palette="${selectedPaletteName}"]`) || paletteListEl.querySelector('.palette-card');
      if (sel) sel.focus();
      document.body.style.overflow = 'hidden';
    });
    document.addEventListener('focus', enforceFocus, true);
  }

  function closePaletteModal() {
    if (!paletteModal) return;
    paletteModal.setAttribute('aria-hidden', 'true');
    paletteModal.style.display = 'none';
    document.body.style.overflow = '';
    document.removeEventListener('focus', enforceFocus, true);
    if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') lastFocusedBeforeModal.focus();
    else if (openPaletteModalBtn) openPaletteModalBtn.focus();
  }

  function enforceFocus(ev) {
    if (!paletteModal.contains(ev.target)) {
      ev.stopPropagation();
      const sel = paletteListEl.querySelector(`.palette-card[data-palette="${selectedPaletteName}"]`) || paletteListEl.querySelector('.palette-card');
      if (sel) sel.focus();
    }
  }

  if (paletteModal) {
    paletteModal.addEventListener('click', (ev) => {
      if (ev.target && ev.target.matches('[data-action="close"], .palette-overlay')) closePaletteModal();
    });
  }
  if (closePaletteModalBtn) closePaletteModalBtn.addEventListener('click', closePaletteModal);
  if (applyPaletteBtn) applyPaletteBtn.addEventListener('click', () => { const sel = palettes.find(p => p.name === selectedPaletteName) || palettes[0]; applyPalette(sel); closePaletteModal(); });
  if (resetPaletteBtn) resetPaletteBtn.addEventListener('click', () => { selectedPaletteName = palettes[0].name; applyPalette(palettes[0]); buildPaletteList(); });

  document.addEventListener('keydown', (ev) => {
    if (paletteModal && paletteModal.getAttribute('aria-hidden') === 'false' && ev.key === 'Escape') closePaletteModal();
  });

  if (openPaletteModalBtn) {
    openPaletteModalBtn.addEventListener('click', openPaletteModal);
    openPaletteModalBtn.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openPaletteModal(); }
    });
  }

  /* =========================
     EXISTING FEATURES (thumb click, busca, toggle size, Esc)
     ========================= */

  // helper loadVideo (usado também para persist)
  const LAST_VIDEO_KEY = 'nerdflix-last-video';
  function loadVideo(src, thumbEl=null) {
    if (!player) return;
    player.src = src;
    try { localStorage.setItem(LAST_VIDEO_KEY, src); } catch(e){}
    if (thumbEl) {
      const title = thumbEl.dataset.title || thumbEl.querySelector('img')?.alt || 'Vídeo';
      mainTitle.textContent = title;
      mainDesc.textContent = thumbEl.dataset.desc || '';
      thumbs.forEach(x => x.classList.remove('active'));
      thumbEl.classList.add('active');
      player.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // init last video
  (function initLastVideo() {
    try {
      const last = localStorage.getItem(LAST_VIDEO_KEY);
      if (last && player) {
        player.src = last;
        const found = thumbs.find(t => t.dataset.video === last);
        if (found) {
          mainTitle.textContent = found.dataset.title || found.querySelector('img')?.alt || 'Vídeo';
        }
      }
    } catch(e) {}
  })();

  // thumbs click
  thumbs.forEach(t => {
    t.addEventListener('click', (ev) => {
      ev.preventDefault();
      const src = t.dataset.video;
      loadVideo(src, t);
    });
    t.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); t.click(); }
    });
  });

  // filter thumbs
  function filterThumbs(q = '') {
    const ql = (q || '').trim().toLowerCase();
    thumbs.forEach(t => {
      const txt = ((t.dataset.video || '') + ' ' + (t.dataset.title || '') + ' ' + (t.querySelector('img')?.alt || '')).toLowerCase();
      t.style.display = txt.includes(ql) ? '' : 'none';
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      if (q === 'nerdflix') {
        searchInput.value = '';
        filterThumbs('');
        activateRetroMode();
        return;
      }
      filterThumbs(q);
    });
  }

  if (toggleSizeBtn) {
    toggleSizeBtn.addEventListener('click', () => {
      body.classList.toggle('large-thumbs');
      toggleSizeBtn.textContent = body.classList.contains('large-thumbs') ? 'Thumbs menores' : 'Alternar tamanho das thumbs';
    });
  }

  // ESC behavior already implemented later via global keydown

  /* =========================
     EASTER EGG: RETRO MODE
     ========================= */
  let retroTimeout = null;
  function activateRetroMode() {
    if (body.classList.contains('retro-mode')) { pulseRetroBanner('Já tá no modo retrô!'); return; }
    body.classList.add('retro-mode');
    showRetroBanner();
    if (retroTimeout) clearTimeout(retroTimeout);
    retroTimeout = setTimeout(() => deactivateRetroMode(), 1000 * 60 * 5);
  }
  function deactivateRetroMode() {
    body.classList.remove('retro-mode');
    removeRetroBanner();
    if (retroTimeout) { clearTimeout(retroTimeout); retroTimeout = null; }
  }

  function showRetroBanner() {
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

    banner.querySelector('.close-retro').addEventListener('click', () => deactivateRetroMode());
    banner.addEventListener('click', (ev) => { if (ev.target.closest('.close-retro')) return; deactivateRetroMode(); });
    banner.addEventListener('mouseenter', () => {
      banner.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-4px) scale(1.02)' }], { duration: 220, easing: 'ease-out' });
    });
  }

  function removeRetroBanner() { const b = document.querySelector('.retro-banner'); if (b) b.remove(); }

  function pulseRetroBanner(msg) {
    const tmp = document.createElement('div');
    tmp.className = 'retro-banner';
    tmp.style.top = '8%';
    tmp.style.background = 'linear-gradient(90deg, rgba(52,209,255,0.06), rgba(124,255,124,0.02))';
    tmp.innerHTML = `<div><div class="title">${msg}</div></div>`;
    document.body.appendChild(tmp);
    setTimeout(() => tmp.remove(), 1300);
  }

  window.__toggleRetro = () => { if (body.classList.contains('retro-mode')) deactivateRetroMode(); else activateRetroMode(); };

  // ESC global handler (closes modals, retro, or stops video)
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      if (paletteModal && paletteModal.getAttribute('aria-hidden') === 'false') { closePaletteModal(); return; }
      if (body.classList.contains('retro-mode')) { deactivateRetroMode(); return; }
      if (player) player.src = '';
    }
  });

  // ---------- end of DOMContentLoaded block ----------
}); // end DOMContentLoaded

/* ======================
   SUPABASE AUTH INTEGRATION (fora do DOMContentLoaded para garantir client ok)
   ====================== */

// Observação: os elementos do DOM são acessados após DOMContentLoaded,
// então dentro de listeners fazemos guard checks (?.) pra evitar erros.

const authModal = document.getElementById('authModal');
const closeAuthModalBtn = document.getElementById('closeAuthModal');
const signupFormEl = document.getElementById('signupForm');
const loginFormEl = document.getElementById('loginForm');
const logoutBtnEl = document.getElementById('logoutBtn');
const authMsgEl = document.getElementById('authMsg');

// criar botão no header para abrir modal (se header-actions existir)
(function createAuthHeaderButton() {
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions) return;
  if (document.getElementById('btnAuthOpen')) return; // já criado
  const btn = document.createElement('button');
  btn.id = 'btnAuthOpen';
  btn.className = 'btn small';
  btn.textContent = 'Entrar';
  btn.style.cursor = 'pointer';
  headerActions.appendChild(btn);
  btn.addEventListener('click', showAuthModal);
})();

function showAuthModal() {
  if (!authModal) return;
  authModal.style.display = 'flex';
  authModal.setAttribute('aria-hidden', 'false');
  setTimeout(() => document.getElementById('signupEmail')?.focus(), 120);
}
function closeAuthModal() {
  if (!authModal) return;
  authModal.style.display = 'none';
  authModal.setAttribute('aria-hidden', 'true');
}

closeAuthModalBtn?.addEventListener('click', closeAuthModal);
document.addEventListener('click', (ev) => {
  if (ev.target && ev.target.matches('[data-action="close"], .auth-overlay')) closeAuthModal();
});

// SIGNUP
signupFormEl?.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  if (!authMsgEl) return;
  authMsgEl.textContent = 'Criando conta...';
  try {
    const { data, error } = await supabaseClient.auth.signUp({ email, password }, { redirectTo: window.location.href });
    if (error) {
      authMsgEl.textContent = 'Erro: ' + error.message;
      return;
    }
    authMsgEl.textContent = 'Conta criada — verifique seu e-mail para confirmar (se habilitado).';
  } catch (e) {
    console.error('signup error', e);
    authMsgEl.textContent = 'Erro no signup.';
  }
});

// LOGIN
loginFormEl?.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  if (!authMsgEl) return;
  authMsgEl.textContent = 'Entrando...';
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      authMsgEl.textContent = 'Erro: ' + error.message;
      return;
    }
    authMsgEl.textContent = 'Logado com sucesso!';
    closeAuthModal();
    updateAuthUI();
  } catch (e) {
    console.error('login error', e);
    authMsgEl.textContent = 'Erro no login.';
  }
});

// LOGOUT
logoutBtnEl?.addEventListener('click', async () => {
  try {
    await supabaseClient.auth.signOut();
    updateAuthUI();
  } catch (e) { console.error('logout error', e); }
});

// Atualiza UI conforme sessão atual
async function updateAuthUI() {
  try {
    const { data } = await supabaseClient.auth.getUser();
    const user = data?.user || null;
    const btnHeader = document.getElementById('btnAuthOpen');
    if (user) {
      if (logoutBtnEl) logoutBtnEl.style.display = 'inline-block';
      if (btnHeader) { btnHeader.textContent = user.email.split('@')[0]; btnHeader.classList.add('disabled'); btnHeader.disabled = true; }
      if (authMsgEl) authMsgEl.textContent = 'Logado como ' + (user.email || '');
    } else {
      if (logoutBtnEl) logoutBtnEl.style.display = 'none';
      if (btnHeader) { btnHeader.textContent = 'Entrar'; btnHeader.classList.remove('disabled'); btnHeader.disabled = false; }
      if (authMsgEl) authMsgEl.textContent = '';
    }
  } catch (e) {
    console.error('updateAuthUI error', e);
  }
}

// reage a mudanças de auth (ex.: login em outra aba)
supabaseClient.auth.onAuthStateChange((_event, _session) => {
  updateAuthUI();
});

// inicializa UI auth (tenta executar, se DOM ainda não pronto, tolerância com nulls)
updateAuthUI();

// DEBUG helper
console.log('Script carregado — recursos: thumbs', thumbs?.length || 0);
