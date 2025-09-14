// script.js — carregado with defer in head
// Modernized player with YouTube IFrame API, custom controls, theater mode, recommendations.
// Also preserves theme, palette modal, retro easter-egg and other existing features.

document.addEventListener('DOMContentLoaded', () => {
  /* ---------- DOM refs ---------- */
  const thumbs = Array.from(document.querySelectorAll('.thumb'));
  const playerContainer = document.getElementById('mainPlayer'); // YT container
  const playerWrap = document.getElementById('playerWrap');
  const mainTitle = document.getElementById('main-title');
  const mainDesc = document.getElementById('main-desc');
  const searchInput = document.getElementById('search');
  const toggleSizeBtn = document.getElementById('toggleSize');
  const body = document.body;

  // player controls
  const btnPlay = document.getElementById('btnPlay');
  const progress = document.getElementById('progress');
  const progressFilled = document.getElementById('progressFilled');
  const currentTimeEl = document.getElementById('currentTime');
  const durationEl = document.getElementById('duration');
  const speedSelect = document.getElementById('speedSelect');
  const volumeRange = document.getElementById('volumeRange');
  const btnTheater = document.getElementById('btnTheater');
  const btnAutoplay = document.getElementById('btnAutoplay');
  const btnShare = document.getElementById('btnShare');
  const recommendList = document.getElementById('recommendList');
  const viewCountEl = document.getElementById('viewCount');
  const publishDateEl = document.getElementById('publishDate');
  const metaDurationEl = document.getElementById('metaDuration');

  // header / palette modal / theme controls kept later (not shown here for brevity)
  const themeToggleBtn = document.getElementById('themeToggle');
  const openPaletteModalBtn = document.getElementById('openPaletteModal');
  const paletteModal = document.getElementById('paletteModal');
  const paletteListEl = document.getElementById('paletteList');
  const closePaletteModalBtn = document.getElementById('closePaletteModal');
  const applyPaletteBtn = document.getElementById('applyPaletteBtn');
  const resetPaletteBtn = document.getElementById('resetPaletteBtn');

  /* ---------- YT Player setup ---------- */
  let ytPlayer = null;
  let ytReady = false;
  let progressUpdater = null;
  let autoplayNext = false;

  // helper: extract videoId from embed url or data-video
  function extractVideoId(url) {
    // handles https://www.youtube.com/embed/VIDEOID?rel=0 and https://youtu.be/VIDEOID etc.
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube') && u.pathname.startsWith('/embed/')) {
        return u.pathname.split('/embed/')[1].split('?')[0];
      }
      if (u.hostname === 'youtu.be') {
        return u.pathname.slice(1);
      }
      // fallback: try to find v= query
      return u.searchParams.get('v') || '';
    } catch (e) {
      // last resort: regex
      const m = url.match(/(?:embed\/|v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
      return m ? m[1] : '';
    }
  }

  // Load YouTube IFrame API dynamically
  function loadYouTubeAPI() {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        resolve(window.YT);
        return;
      }
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => {
        resolve(window.YT);
      };
    });
  }

  // create player
  async function createPlayer(initialVideoId) {
    const YT = await loadYouTubeAPI();
    if (ytPlayer) {
      // already created
      return;
    }
    ytPlayer = new YT.Player('mainPlayer', {
      videoId: initialVideoId || '',
      playerVars: {
        rel: 0,
        modestbranding: 1,
        controls: 0,
        iv_load_policy: 3,
        fs: 1,
        disablekb: 0,
      },
      events: {
        onReady: (e) => {
          ytReady = true;
          // ensure volume initial
          const vol = Number(volumeRange.value);
          if (!isNaN(vol)) ytPlayer.setVolume(vol);
          // set speed
          ytPlayer.setPlaybackRate(Number(speedSelect.value));
          updateDuration();
          startProgressUpdater();
        },
        onStateChange: (e) => {
          // ended -> autoplay next or stop
          if (e.data === YT.PlayerState.ENDED) {
            if (btnAutoplay.getAttribute('aria-pressed') === 'true') {
              playNextRecommendation();
            } else {
              updatePlayButton(false);
            }
          } else if (e.data === YT.PlayerState.PLAYING) {
            updatePlayButton(true);
          } else if (e.data === YT.PlayerState.PAUSED) {
            updatePlayButton(false);
          }
          updateDuration();
        }
      }
    });
  }

  // update duration and meta
  function updateDuration() {
    if (!ytReady || !ytPlayer) return;
    const dur = ytPlayer.getDuration() || 0;
    durationEl.textContent = formatTime(dur);
    metaDurationEl.textContent = formatTime(dur);
  }

  function startProgressUpdater() {
    if (progressUpdater) clearInterval(progressUpdater);
    progressUpdater = setInterval(() => {
      if (!ytReady || !ytPlayer) return;
      const dur = ytPlayer.getDuration();
      const cur = ytPlayer.getCurrentTime();
      if (isFinite(dur) && dur > 0) {
        const pct = (cur / dur) * 100;
        progressFilled.style.width = pct + '%';
        progress.setAttribute('aria-valuenow', Math.round(pct));
      }
      currentTimeEl.textContent = formatTime(cur);
    }, 250);
  }

  function stopProgressUpdater() {
    if (progressUpdater) clearInterval(progressUpdater);
    progressUpdater = null;
  }

  function updatePlayButton(isPlaying) {
    btnPlay.textContent = isPlaying ? '❚❚' : '►';
  }

  function formatTime(s) {
    s = Math.max(0, Math.floor(s || 0));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  // load and play given video id (optionally autoplay)
  async function loadVideoById(id, doPlay = false) {
    if (!id) return;
    await createPlayer(id);
    if (!ytPlayer) return;
    if (ytReady) {
      try {
        ytPlayer.loadVideoById({ videoId: id });
        if (!doPlay) ytPlayer.pauseVideo();
        // small delay to fetch meta
        setTimeout(() => {
          updateDuration();
          fetchVideoMeta(id);
        }, 600);
      } catch (e) {
        console.warn('loadVideo error', e);
      }
    } else {
      // create player with videoId on init
      // if player not created yet it will start with initial video id
      // handled in createPlayer
    }
  }

  // fetch simple meta from oembed (no API key) — fallback
  async function fetchVideoMeta(videoId) {
    // use no-key oembed to get title/author, but not view count; view/publish needs API key (omitted)
    try {
      const res = await fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${videoId}`);
      if (!res.ok) throw new Error('no oembed');
      const data = await res.json();
      // oembed gives title, author_name
      mainTitle.textContent = data.title || mainTitle.textContent;
      // keep mainDesc simple
      mainDesc.textContent = `Canal: ${data.author_name || '—'}`;
      // viewCount/publishDate unknown w/o API key — set to dash
      viewCountEl.textContent = '—';
      publishDateEl.textContent = '—';
    } catch (e) {
      // ignore; keep existing title
    }
  }

  // play next in recommendations (simple logic: first visible item not active)
  function playNextRecommendation() {
    const items = Array.from(recommendList.querySelectorAll('.recommend-item'));
    if (!items.length) return;
    // find active
    const activeId = playerContainer.getAttribute('data-video-id');
    let next = items.find(it => it.getAttribute('data-video-id') !== activeId);
    if (!next) next = items[0];
    if (next) {
      const vid = next.getAttribute('data-video-id');
      const autoplay = true;
      // simulate click behavior
      loadVideoById(vid, autoplay);
      // update active visual
      setActiveById(vid);
    }
  }

  /* ---------- controls behavior ---------- */

  // play/pause
  btnPlay.addEventListener('click', () => {
    if (!ytReady || !ytPlayer) return;
    const state = ytPlayer.getPlayerState();
    // YT state 1 = playing, 2 = paused
    if (state === 1) {
      ytPlayer.pauseVideo();
    } else {
      ytPlayer.playVideo();
    }
  });

  // progress click / seek
  function seekToFromEvent(e) {
    if (!ytReady || !ytPlayer) return;
    const rect = progress.getBoundingClientRect();
    const x = (e.clientX ?? (e.touches && e.touches[0].clientX)) - rect.left;
    const pct = Math.min(Math.max(0, x / rect.width), 1);
    const dur = ytPlayer.getDuration();
    if (isFinite(dur) && dur > 0) {
      ytPlayer.seekTo(pct * dur, true);
    }
  }
  progress.addEventListener('click', seekToFromEvent);
  // support scrubbing on drag
  let scrubbing = false;
  progress.addEventListener('mousedown', () => { scrubbing = true; });
  window.addEventListener('mousemove', (ev) => { if (scrubbing) seekToFromEvent(ev); });
  window.addEventListener('mouseup', () => { scrubbing = false; });

  // keyboard seek (left/right)
  progress.addEventListener('keydown', (ev) => {
    if (!ytReady || !ytPlayer) return;
    const dur = ytPlayer.getDuration() || 0;
    if (ev.key === 'ArrowRight') {
      ytPlayer.seekTo(Math.min(dur, ytPlayer.getCurrentTime() + 5), true);
    } else if (ev.key === 'ArrowLeft') {
      ytPlayer.seekTo(Math.max(0, ytPlayer.getCurrentTime() - 5), true);
    }
  });

  // speed
  speedSelect.addEventListener('change', () => {
    if (!ytReady || !ytPlayer) return;
    const v = Number(speedSelect.value);
    ytPlayer.setPlaybackRate(v);
  });

  // volume
  volumeRange.addEventListener('input', () => {
    const v = Number(volumeRange.value);
    if (ytReady && ytPlayer) ytPlayer.setVolume(v);
  });

  // theater mode
  btnTheater.addEventListener('click', () => {
    body.classList.toggle('theater-mode');
    btnTheater.setAttribute('aria-pressed', body.classList.contains('theater-mode') ? 'true' : 'false');
    // focus back to play button
    btnPlay.focus();
  });

  // autoplay toggle
  btnAutoplay.addEventListener('click', () => {
    const pressed = btnAutoplay.getAttribute('aria-pressed') === 'true';
    btnAutoplay.setAttribute('aria-pressed', String(!pressed));
    btnAutoplay.title = !pressed ? 'Autoplay ligado' : 'Autoplay desligado';
  });

  // share (copy link)
  btnShare.addEventListener('click', () => {
    const vid = playerContainer.getAttribute('data-video-id');
    if (!vid) return;
    const url = `https://youtu.be/${vid}`;
    navigator.clipboard?.writeText(url).then(() => {
      // tiny feedback
      btnShare.textContent = '✓';
      setTimeout(() => btnShare.textContent = '🔗', 900);
    }).catch(() => {
      alert('Não foi possível copiar o link — use Ctrl+C no endereço.');
    });
  });

  /* ---------- Recommendations panel: clone existing thumbs ---------- */
  function buildRecommendations() {
    recommendList.innerHTML = '';
    // take first N thumbs from page and create recommend items
    const pageThumbs = Array.from(document.querySelectorAll('.categoria-videos .thumb'));
    pageThumbs.forEach((t) => {
      const id = extractVideoId(t.dataset.video || t.href || '');
      if (!id) return;
      const item = document.createElement('button');
      item.className = 'recommend-item';
      item.type = 'button';
      item.setAttribute('data-video-id', id);
      item.innerHTML = `
        <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="">
        <div class="rec-title">${(t.dataset.title || t.querySelector('img')?.alt || '').slice(0, 60)}</div>
      `;
      item.addEventListener('click', () => {
        // load and play
        loadVideoById(id, btnAutoplay.getAttribute('aria-pressed') === 'true');
        setActiveById(id);
      });
      recommendList.appendChild(item);
    });
  }

  function setActiveById(videoId) {
    // update active states in both carousels and recommend list
    document.querySelectorAll('.thumb').forEach(th => {
      const id = extractVideoId(th.dataset.video || th.href || '');
      if (id === videoId) th.classList.add('active');
      else th.classList.remove('active');
    });
    recommendList.querySelectorAll('.recommend-item').forEach(it => {
      if (it.getAttribute('data-video-id') === videoId) it.setAttribute('aria-current', 'true');
      else it.removeAttribute('aria-current');
    });
    playerContainer.setAttribute('data-video-id', videoId);
  }

  /* ---------- Thumb click behavior (use YT API loader) ---------- */
  thumbs.forEach(t => {
    t.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const vid = extractVideoId(t.dataset.video || t.href || '');
      if (!vid) return;
      // create player if needed and load
      await createPlayer(vid);
      const autoplay = btnAutoplay.getAttribute('aria-pressed') === 'true';
      loadVideoById(vid, autoplay);
      // update UI text
      const title = t.dataset.title || t.querySelector('img')?.alt || 'Vídeo';
      mainTitle.textContent = title;
      mainDesc.textContent = '';
      setActiveById(vid);
      if (!autoplay && ytPlayer && ytReady) {
        // ensure paused if autoplay off
        ytPlayer.pauseVideo();
      }
      // scroll to player for UX
      playerWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    t.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault(); t.click();
      }
    });
  });

  /* ---------- progress initial click to set time when user clicks a thumb to ensure duration updates ---------- */

  /* ---------- small helpers ---------- */
  function safeParseInt(v, def = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  }

  /* ---------- init everything ---------- */
  (async function init() {
    // build recommendations
    buildRecommendations();

    // pre-create player with initial video id (from existing default embed src)
    // try to find the first thumb or the old iframe src (fallback)
    let initialId = null;
    // try first thumb in DOM
    const firstThumb = document.querySelector('.thumb');
    if (firstThumb) initialId = extractVideoId(firstThumb.dataset.video || firstThumb.href || '');
    // if none, fallback to mainPlayer data attr or empty
    await createPlayer(initialId);

    // attach UI updates for player events via interval (already handled in startProgressUpdater)
    // set initial button states
    btnAutoplay.setAttribute('aria-pressed', 'false');

    // ensure keyboard controls for play/pause spacebar when player focused
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'k') {
        if (ytReady && ytPlayer) {
          const st = ytPlayer.getPlayerState();
          if (st === 1) ytPlayer.pauseVideo();
          else ytPlayer.playVideo();
        }
      }
      // left/right handled for progress when focused
    });
  })();

  /* ---------- additional app-level features preserved from previous code (theme, palette modal, retro, etc.) ----------
     Due to message length they are appended below (palette modal, retro, theme handling, search filtering).
     Keep these functionalities unchanged from previous iterations.
  */

  /* -----------------------
     THEME & PALETTE (kept)
     ----------------------- */
  const rootEl = document.documentElement;
  const THEME_KEY = 'nerdflix-theme';
  const ACCENT_KEY = 'nerdflix-accent';

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
    if (saved === 'light' || saved === 'dark') applyTheme(saved);
    else {
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      applyTheme(prefersLight ? 'light' : 'dark');
    }
  })();
  themeToggleBtn.addEventListener('click', () => {
    const current = rootEl.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
  });

  /* -----------------------
     COLOR PALETTES (kept)
     ----------------------- */
  const palettes = [
    { name: 'vermelho', label: 'Vermelho', accent: '#E42A2A', accentStrong: 'rgba(228,42,42,0.95)', thumbBorder: 'rgba(228,42,42,0.9)' },
    { name: 'azul',     label: 'Azul',    accent: '#2B8BF4', accentStrong: 'rgba(43,139,244,0.95)', thumbBorder: 'rgba(43,139,244,0.9)' },
    { name: 'verde',    label: 'Verde',   accent: '#28C76F', accentStrong: 'rgba(40,199,111,0.95)', thumbBorder: 'rgba(40,199,111,0.9)' },
    { name: 'roxo',     label: 'Roxo',    accent: '#8E44FF', accentStrong: 'rgba(142,68,255,0.95)', thumbBorder: 'rgba(142,68,255,0.9)' },
    { name: 'laranja',  label: 'Laranja', accent: '#FF7A2D', accentStrong: 'rgba(255,122,45,0.95)', thumbBorder: 'rgba(255,122,45,0.9)' }
  ];

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

  (function initPalette() {
    let saved = null;
    try { saved = localStorage.getItem(ACCENT_KEY); } catch (e) { saved = null; }
    if (saved) {
      const found = palettes.find(p => p.name === saved);
      if (found) { applyPalette(found); return; }
    }
    applyPalette(palettes[0]);
  })();

  /* -----------------------
     PALETTE MODAL (kept behavior)
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
      const sw = document.createElement('span'); sw.className='palette-swatch';
      const sw1 = document.createElement('span'); sw1.className='sw1'; sw1.style.background=p.accent;
      const sw2 = document.createElement('span'); sw2.className='sw2'; sw2.style.background=p.accentStrong;
      sw.appendChild(sw1); sw.appendChild(sw2);
      const meta = document.createElement('div'); meta.className='palette-meta';
      const nameEl = document.createElement('div'); nameEl.className='palette-name'; nameEl.textContent = p.label;
      const descEl = document.createElement('div'); descEl.className='palette-desc'; descEl.textContent = p.name;
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
  function focusNextCard(i){ const nodes=Array.from(paletteListEl.querySelectorAll('.palette-card')); const next=nodes[(i+1)%nodes.length]; if(next) next.focus(); }
  function focusPrevCard(i){ const nodes=Array.from(paletteListEl.querySelectorAll('.palette-card')); const prev=nodes[(i-1+nodes.length)%nodes.length]; if(prev) prev.focus(); }
  function openPaletteModal() {
    buildPaletteList(); lastFocusedBeforeModal = document.activeElement;
    paletteModal.setAttribute('aria-hidden','false'); paletteModal.style.display='flex';
    requestAnimationFrame(()=>{ const sel = paletteListEl.querySelector(`.palette-card[data-palette="${selectedPaletteName}"]`) || paletteListEl.querySelector('.palette-card'); if(sel) sel.focus(); document.body.style.overflow='hidden'; });
    document.addEventListener('focus', enforceFocus, true);
  }
  function closePaletteModal() { paletteModal.setAttribute('aria-hidden','true'); paletteModal.style.display='none'; document.body.style.overflow=''; document.removeEventListener('focus', enforceFocus, true); if(lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') lastFocusedBeforeModal.focus(); else openPaletteModalBtn.focus(); }
  function enforceFocus(ev) { if(!paletteModal.contains(ev.target)){ ev.stopPropagation(); const sel = paletteListEl.querySelector(`.palette-card[data-palette="${selectedPaletteName}"]`) || paletteListEl.querySelector('.palette-card'); if(sel) sel.focus(); } }
  paletteModal.addEventListener('click', (ev)=>{ if(ev.target && ev.target.matches('[data-action="close"], .palette-overlay')) closePaletteModal(); });
  closePaletteModalBtn.addEventListener('click', closePaletteModal);
  applyPaletteBtn.addEventListener('click', ()=>{ const sel = palettes.find(p=>p.name===selectedPaletteName)||palettes[0]; applyPalette(sel); closePaletteModal(); });
  resetPaletteBtn.addEventListener('click',()=>{ selectedPaletteName = palettes[0].name; applyPalette(palettes[0]); buildPaletteList(); });
  openPaletteModalBtn.addEventListener('click', openPaletteModal);
  openPaletteModalBtn.addEventListener('keydown', (ev)=>{ if(ev.key==='Enter' || ev.key===' '){ ev.preventDefault(); openPaletteModal(); } });

  /* -----------------------
     SEARCH + EASTER EGG (kept)
     ----------------------- */
  function filterThumbs(q = '') {
    const ql = (q || '').trim().toLowerCase();
    thumbs.forEach(t => {
      const txt = (t.href + ' ' + (t.dataset.title || '') + ' ' + (t.querySelector('img')?.alt || '')).toLowerCase();
      t.style.display = txt.includes(ql) ? '' : 'none';
    });
  }

  // EASTER EGG: "nerdflix" in search triggers retro mode (kept as before)
  function activateRetroMode() {
    if (body.classList.contains('retro-mode')) { pulseRetroBanner('Já tá no modo retrô!'); return; }
    body.classList.add('retro-mode');
    showRetroBanner();
    if (window.retroTimeout) clearTimeout(window.retroTimeout);
    window.retroTimeout = setTimeout(() => { deactivateRetroMode(); }, 1000 * 60 * 5);
  }
  function deactivateRetroMode() { body.classList.remove('retro-mode'); removeRetroBanner(); if(window.retroTimeout){ clearTimeout(window.retroTimeout); window.retroTimeout=null; } }
  function showRetroBanner() {
    if (document.querySelector('.retro-banner')) return;
    const banner = document.createElement('div'); banner.className='retro-banner'; banner.setAttribute('role','status');
    banner.innerHTML = `<div><div class="title">EASTER EGG DESBLOQUEADO!</div><div class="sub">Modo Retrô ativado — bem vindo ao cinema pixel 👾</div></div><div class="hint">Pressione ESC para sair</div><button class="close-retro" aria-label="Fechar modo retrô">✕</button>`;
    document.body.appendChild(banner);
    banner.querySelector('.close-retro').addEventListener('click', ()=>{ deactivateRetroMode(); });
    banner.addEventListener('click',(ev)=>{ if(ev.target.closest('.close-retro')) return; deactivateRetroMode(); });
    banner.addEventListener('mouseenter', ()=>{ banner.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-4px) scale(1.02)' }], { duration: 220, easing: 'ease-out' }); });
  }
  function removeRetroBanner(){ const b=document.querySelector('.retro-banner'); if(b) b.remove(); }
  function pulseRetroBanner(msg){ const tmp = document.createElement('div'); tmp.className='retro-banner'; tmp.style.top='8%'; tmp.style.background='linear-gradient(90deg, rgba(52,209,255,0.06), rgba(124,255,124,0.02))'; tmp.innerHTML=`<div><div class="title">${msg}</div></div>`; document.body.appendChild(tmp); setTimeout(()=>tmp.remove(),1300); }

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

  /* -----------------------
     MISC: toggle thumbs size, Esc behavior, keyboard
     ----------------------- */
  toggleSizeBtn.addEventListener('click', () => {
    body.classList.toggle('large-thumbs');
    toggleSizeBtn.textContent = body.classList.contains('large-thumbs') ? 'Thumbs menores' : 'Alternar tamanho das thumbs';
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      if (paletteModal.getAttribute('aria-hidden') === 'false') { closePaletteModal(); return; }
      if (body.classList.contains('retro-mode')) { deactivateRetroMode(); return; }
      if (body.classList.contains('theater-mode')) { body.classList.remove('theater-mode'); return; }
      // pause video if playing
      if (ytReady && ytPlayer) ytPlayer.pauseVideo();
    }
  });

  // ensure clicking outside modal overlay closes it (already applied)
});
