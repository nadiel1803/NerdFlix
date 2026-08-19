/* NERDFLIX — núcleo da aplicação estática */
(() => {
  'use strict';

  const STORAGE = {
    theme: 'nerdflix-theme',
    accent: 'nerdflix-accent',
    thumbSize: 'nerdflix-thumb-size',
    autoplay: 'nerdflix-autoplay',
    favorites: 'nerdflix-favorites',
    profile: 'nerdflix-profile'
  };

  const PALETTES = [
    { name: 'vermelho', label: 'Vermelho', accent: '#e50914', strong: '#ff3340', soft: 'rgba(229, 9, 20, .18)' },
    { name: 'azul', label: 'Azul', accent: '#3b82f6', strong: '#60a5fa', soft: 'rgba(59, 130, 246, .18)' },
    { name: 'verde', label: 'Verde', accent: '#16a34a', strong: '#4ade80', soft: 'rgba(22, 163, 74, .18)' },
    { name: 'roxo', label: 'Roxo', accent: '#8b5cf6', strong: '#a78bfa', soft: 'rgba(139, 92, 246, .18)' },
    { name: 'laranja', label: 'Laranja', accent: '#f97316', strong: '#fb923c', soft: 'rgba(249, 115, 22, .18)' }
  ];

  // Os IDs são os vídeos fornecidos no projeto original. Edite os metadados aqui.
  const CATALOG = [
    { id: 'wlpr0jpGGGI', title: 'Leon & Nilce — Filme 01', description: 'Primeiro vídeo da coleção Leon & Nilce: Filmes.', category: 'LEON & NILCE: FILMES', type: 'Filme', tags: ['Leon & Nilce', 'Coleção'] },
    { id: 'esjS0A8hwfs', title: 'Leon & Nilce — Filme 02', description: 'Segundo vídeo da coleção Leon & Nilce: Filmes.', category: 'LEON & NILCE: FILMES', type: 'Filme', tags: ['Leon & Nilce', 'Coleção'] },
    { id: 'n-sYjHOkwIk', title: 'Leon & Nilce — Filme 03', description: 'Terceiro vídeo da coleção Leon & Nilce: Filmes.', category: 'LEON & NILCE: FILMES', type: 'Filme', tags: ['Leon & Nilce', 'Coleção'] },
    { id: '818TmDjc_ak', title: 'Leon & Nilce — Filme 04', description: 'Quarto vídeo da coleção Leon & Nilce: Filmes.', category: 'LEON & NILCE: FILMES', type: 'Filme', tags: ['Leon & Nilce', 'Coleção'] },
    { id: 'GaGwd-NXyGM', title: 'Leon & Nilce — Filme 05', description: 'Quinto vídeo da coleção Leon & Nilce: Filmes.', category: 'LEON & NILCE: FILMES', type: 'Filme', tags: ['Leon & Nilce', 'Coleção'] },
    { id: 'VRSyYcPRws0', title: 'Leon & Nilce — Filme 06', description: 'Sexto vídeo da coleção Leon & Nilce: Filmes.', category: 'LEON & NILCE: FILMES', type: 'Filme', tags: ['Leon & Nilce', 'Coleção'] },
    { id: 'FedBr0CyAlE', title: 'Leon & Nilce — Filme 07', description: 'Sétimo vídeo da coleção Leon & Nilce: Filmes.', category: 'LEON & NILCE: FILMES', type: 'Filme', tags: ['Leon & Nilce', 'Coleção'] },
    { id: 'fJYkXmAdkrQ', title: 'Leon & Nilce — Filme 08', description: 'Oitavo vídeo da coleção Leon & Nilce: Filmes.', category: 'LEON & NILCE: FILMES', type: 'Filme', tags: ['Leon & Nilce', 'Coleção'] }
  ];

  const DEFAULT_PROFILE = { name: 'Usuário', language: 'pt-BR' };
  const root = document.documentElement;
  const body = document.body;
  const page = body.dataset.page || 'home';

  const storage = {
    get(key, fallback = null) {
      try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* storage indisponível */ }
    },
    getJSON(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    setJSON(key, value) { this.set(key, JSON.stringify(value)); }
  };

  const state = {
    theme: storage.get(STORAGE.theme, '') || (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'),
    accent: storage.get(STORAGE.accent, 'vermelho'),
    thumbSize: storage.get(STORAGE.thumbSize, 'normal'),
    autoplay: storage.get(STORAGE.autoplay, 'false') === 'true',
    favorites: new Set(storage.getJSON(STORAGE.favorites, [])),
    profile: { ...DEFAULT_PROFILE, ...storage.getJSON(STORAGE.profile, {}) }
  };

  const byId = (id) => document.getElementById(id);
  const query = (selector, scope = document) => scope.querySelector(selector);
  const queryAll = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const videoById = (id) => CATALOG.find(video => video.id === id);
  const thumbnail = (id, quality = 'maxresdefault') => `https://i.ytimg.com/vi/${id}/${quality}.jpg`;
  const videoUrl = (id) => `player.html?vid=${encodeURIComponent(id)}`;
  const detailUrl = (id) => `detalhes.html?vid=${encodeURIComponent(id)}`;
  const youtubeUrl = (id) => `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
  const formatCount = (value) => String(value).padStart(2, '0');

  function applyTheme(theme = state.theme, persist = true) {
    state.theme = theme === 'light' ? 'light' : 'dark';
    root.dataset.theme = state.theme;
    if (persist) storage.set(STORAGE.theme, state.theme);
    queryAll('[data-theme-label]').forEach(el => { el.textContent = state.theme === 'dark' ? 'Modo claro' : 'Modo escuro'; });
    queryAll('[data-theme-icon]').forEach(el => { el.textContent = state.theme === 'dark' ? '☼' : '☾'; });
    queryAll('[data-theme-toggle]').forEach(el => el.setAttribute('aria-pressed', String(state.theme === 'light')));
  }

  function applyAccent(name = state.accent, persist = true) {
    const palette = PALETTES.find(item => item.name === name) || PALETTES[0];
    state.accent = palette.name;
    root.style.setProperty('--accent', palette.accent);
    root.style.setProperty('--accent-strong', palette.strong);
    root.style.setProperty('--accent-soft', palette.soft);
    root.dataset.accent = palette.name;
    if (persist) storage.set(STORAGE.accent, palette.name);
    queryAll('[data-current-palette]').forEach(el => { el.textContent = palette.label; });
    queryAll('[data-palette-card]').forEach(card => {
      const selected = card.dataset.paletteCard === palette.name;
      card.classList.toggle('is-selected', selected);
      card.setAttribute('aria-pressed', String(selected));
    });
  }

  function applyThumbSize(size = state.thumbSize, persist = true) {
    state.thumbSize = size === 'large' ? 'large' : 'normal';
    body.classList.toggle('large-thumbs', state.thumbSize === 'large');
    if (persist) storage.set(STORAGE.thumbSize, state.thumbSize);
    queryAll('[data-thumb-size-label]').forEach(el => { el.textContent = state.thumbSize === 'large' ? 'Cards grandes' : 'Cards compactos'; });
    queryAll('[data-thumb-size]').forEach(el => { el.value = state.thumbSize; });
  }

  function imageWithFallback(img) {
    img.addEventListener('error', () => {
      if (img.dataset.fallback === 'hq') {
        img.dataset.fallback = 'local';
        img.src = 'Assets/629764687ec76b82fb21fce2.png';
        img.classList.add('image-fallback');
      } else if (!img.dataset.fallback) {
        img.dataset.fallback = 'hq';
        img.src = thumbnail(img.dataset.videoId, 'hqdefault');
      }
    });
  }

  function createVideoCard(video, options = {}) {
    const article = document.createElement('article');
    article.className = 'video-card';
    article.dataset.videoId = video.id;
    article.dataset.search = `${video.title} ${video.description} ${video.category} ${video.tags.join(' ')}`.toLowerCase();

    const media = document.createElement('div');
    media.className = 'video-card-media';
    const image = document.createElement('img');
    image.src = thumbnail(video.id);
    image.alt = `Miniatura de ${video.title}`;
    image.loading = 'lazy';
    image.dataset.videoId = video.id;
    imageWithFallback(image);
    media.appendChild(image);

    const shade = document.createElement('div');
    shade.className = 'video-card-shade';
    media.appendChild(shade);
    const badge = document.createElement('span');
    badge.className = 'video-card-badge';
    badge.textContent = video.type;
    media.appendChild(badge);

    const actions = document.createElement('div');
    actions.className = 'video-card-actions';
    const play = document.createElement('a');
    play.className = 'card-play';
    play.href = videoUrl(video.id);
    play.setAttribute('aria-label', `Assistir ${video.title}`);
    play.textContent = '▶';
    actions.appendChild(play);
    const details = document.createElement('a');
    details.className = 'card-info';
    details.href = detailUrl(video.id);
    details.textContent = 'Detalhes';
    actions.appendChild(details);
    media.appendChild(actions);

    const favorite = document.createElement('button');
    favorite.type = 'button';
    favorite.className = 'favorite-button';
    favorite.dataset.favoriteId = video.id;
    favorite.setAttribute('aria-label', `Adicionar ${video.title} aos favoritos`);
    favorite.innerHTML = '<span aria-hidden="true">♡</span>';
    media.appendChild(favorite);
    article.appendChild(media);

    const content = document.createElement('div');
    content.className = 'video-card-content';
    const title = document.createElement('h3');
    title.textContent = video.title;
    content.appendChild(title);
    const description = document.createElement('p');
    description.textContent = video.description;
    content.appendChild(description);
    const meta = document.createElement('div');
    meta.className = 'video-card-meta';
    meta.innerHTML = `<span>${video.category}</span><span>•</span><span>YouTube</span>`;
    content.appendChild(meta);
    article.appendChild(content);

    updateFavoriteButton(favorite);
    favorite.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFavorite(video.id);
    });
    if (options.compact) article.classList.add('is-compact');
    return article;
  }

  function updateFavoriteButton(button) {
    const id = button.dataset.favoriteId;
    const active = state.favorites.has(id);
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
    const icon = query('span', button);
    if (icon) icon.textContent = active ? '♥' : '♡';
  }

  function toggleFavorite(id) {
    if (state.favorites.has(id)) state.favorites.delete(id);
    else state.favorites.add(id);
    storage.setJSON(STORAGE.favorites, [...state.favorites]);
    queryAll('[data-favorite-id]').forEach(updateFavoriteButton);
    updateFavoriteCounters();
    if (page === 'home') renderFavorites();
    if (page === 'details') renderDetailsList(query('#detailsSearch')?.value || '');
    showToast(state.favorites.has(id) ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.');
  }

  function updateFavoriteCounters() {
    queryAll('[data-favorites-count]').forEach(el => { el.textContent = formatCount(state.favorites.size); });
  }

  function renderCards(container, videos, emptyMessage = 'Nenhum vídeo encontrado.') {
    if (!container) return;
    container.innerHTML = '';
    if (!videos.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state compact-empty';
      empty.innerHTML = `<span class="empty-state-icon" aria-hidden="true">⌕</span><strong>${emptyMessage}</strong>`;
      container.appendChild(empty);
      return;
    }
    videos.forEach(video => container.appendChild(createVideoCard(video)));
  }

  function renderFavorites() {
    const section = byId('favoritesSection');
    const grid = byId('favoritesGrid');
    if (!section || !grid) return;
    const videos = CATALOG.filter(video => state.favorites.has(video.id));
    section.hidden = videos.length === 0;
    renderCards(grid, videos, 'Você ainda não favoritou nenhum vídeo.');
  }

  function showToast(message) {
    let toast = byId('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  function setupGlobalUI() {
    applyTheme(state.theme, false);
    applyAccent(state.accent, false);
    applyThumbSize(state.thumbSize, false);
    updateFavoriteCounters();
    queryAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
    queryAll('[data-profile-name]').forEach(el => { el.textContent = state.profile.name || DEFAULT_PROFILE.name; });
    queryAll('[data-theme-toggle]').forEach(button => button.addEventListener('click', () => applyTheme(state.theme === 'dark' ? 'light' : 'dark')));

    const menuToggle = byId('menuToggle');
    const mobileNav = byId('mobileNav');
    if (menuToggle && mobileNav) {
      menuToggle.addEventListener('click', () => {
        const open = mobileNav.classList.toggle('is-open');
        menuToggle.setAttribute('aria-expanded', String(open));
      });
      mobileNav.addEventListener('click', () => {
        mobileNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    }
    queryAll('[data-scroll-target]').forEach(button => button.addEventListener('click', () => {
      const target = byId(button.dataset.scrollTarget);
      target?.scrollBy({ left: button.dataset.direction === 'left' ? -420 : 420, behavior: 'smooth' });
    }));
    queryAll('img').forEach(imageWithFallback);
  }

  function renderHome() {
    renderCards(byId('featuredGrid'), CATALOG.slice(0, 4));
    renderCards(byId('collectionGrid'), CATALOG);
    renderFavorites();

    const search = byId('homeSearch');
    const results = byId('searchResults');
    const searchSection = byId('searchSection');
    search?.addEventListener('input', () => {
      const term = search.value.trim().toLowerCase();
      if (term === 'nerdflix') { search.value = ''; searchSection.hidden = true; activateRetroMode(); return; }
      if (!term) { searchSection.hidden = true; return; }
      searchSection.hidden = false;
      const matches = CATALOG.filter(video => `${video.title} ${video.description} ${video.category} ${video.tags.join(' ')}`.toLowerCase().includes(term));
      renderCards(results, matches, 'Nenhum resultado para essa busca.');
    });
    search?.addEventListener('keydown', event => {
      if (event.key === 'Escape') { search.value = ''; searchSection.hidden = true; search.blur(); }
    });

    const paletteModal = byId('paletteModal');
    const paletteList = byId('paletteList');
    const openPalette = byId('openPalette');
    const closePalette = byId('closePalette');
    if (paletteModal && paletteList && openPalette) {
      paletteList.innerHTML = '';
      PALETTES.forEach(palette => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'palette-card';
        button.dataset.paletteCard = palette.name;
        button.setAttribute('aria-pressed', 'false');
        button.innerHTML = `<span class="palette-swatch" style="--swatch:${palette.accent};--swatch-strong:${palette.strong}"></span><span><strong>${palette.label}</strong><small>Paleta ${palette.name}</small></span>`;
        button.addEventListener('click', () => { applyAccent(palette.name); closeDialog(paletteModal); });
        paletteList.appendChild(button);
      });
      openPalette.addEventListener('click', () => openDialog(paletteModal));
      closePalette?.addEventListener('click', () => closeDialog(paletteModal));
      paletteModal.addEventListener('click', event => { if (event.target === paletteModal) closeDialog(paletteModal); });
      applyAccent(state.accent, false);
    }
  }

  function renderDetailsList(term = '') {
    const list = byId('detailsList');
    if (!list) return;
    const normalized = term.trim().toLowerCase();
    const videos = CATALOG.filter(video => !normalized || `${video.title} ${video.description} ${video.category} ${video.tags.join(' ')}`.toLowerCase().includes(normalized));
    list.innerHTML = '';
    const empty = byId('detailsListEmpty');
    if (empty) empty.hidden = videos.length > 0;
    videos.forEach(video => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'details-list-item';
      item.dataset.videoId = video.id;
      item.innerHTML = `<img src="${thumbnail(video.id, 'hqdefault')}" alt="" loading="lazy"><span><strong>${video.title}</strong><small>${video.category}</small></span><span class="list-arrow" aria-hidden="true">→</span>`;
      const image = query('img', item);
      if (image) { image.dataset.videoId = video.id; imageWithFallback(image); }
      item.addEventListener('click', () => showDetail(video.id));
      list.appendChild(item);
    });
  }

  function showDetail(id, updateUrl = true) {
    const video = videoById(id) || CATALOG[0];
    const detail = byId('detailContent');
    if (!detail || !video) return;
    detail.innerHTML = '';
    const cover = document.createElement('div');
    cover.className = 'detail-cover';
    const image = document.createElement('img');
    image.src = thumbnail(video.id);
    image.alt = `Miniatura de ${video.title}`;
    image.dataset.videoId = video.id;
    imageWithFallback(image);
    cover.appendChild(image);
    const badge = document.createElement('span');
    badge.className = 'video-card-badge';
    badge.textContent = video.type;
    cover.appendChild(badge);
    detail.appendChild(cover);

    const content = document.createElement('div');
    content.className = 'detail-copy';
    content.innerHTML = `<span class="eyebrow">${video.category}</span><h1>${video.title}</h1><p>${video.description}</p><div class="detail-meta"><span>Vídeo selecionado</span><span>•</span><span>Fonte: YouTube</span></div>`;
    const actions = document.createElement('div');
    actions.className = 'detail-actions';
    actions.innerHTML = `<a class="button button-primary" href="${videoUrl(video.id)}">▶ Assistir agora</a><a class="button button-secondary" href="${youtubeUrl(video.id)}" target="_blank" rel="noopener noreferrer">Abrir no YouTube ↗</a>`;
    const favorite = document.createElement('button');
    favorite.type = 'button';
    favorite.className = 'button button-ghost';
    favorite.dataset.favoriteId = video.id;
    favorite.textContent = state.favorites.has(video.id) ? '♥ Nos favoritos' : '♡ Favoritar';
    favorite.addEventListener('click', () => { toggleFavorite(video.id); favorite.textContent = state.favorites.has(video.id) ? '♥ Nos favoritos' : '♡ Favoritar'; });
    actions.appendChild(favorite);
    content.appendChild(actions);
    detail.appendChild(content);
    queryAll('.details-list-item').forEach(item => item.classList.toggle('is-active', item.dataset.videoId === video.id));
    if (updateUrl) history.replaceState({}, '', detailUrl(video.id));
    document.title = `${video.title} — NERDFLIX`;
  }

  function renderDetails() {
    const search = byId('detailsSearch');
    renderDetailsList(search?.value || '');
    const current = new URLSearchParams(location.search).get('vid');
    showDetail(current || CATALOG[0].id, false);
    search?.addEventListener('input', () => renderDetailsList(search.value));
  }

  function renderPlayer() {
    const id = new URLSearchParams(location.search).get('vid');
    const video = videoById(id);
    const videoBox = byId('videoBox');
    const empty = byId('playerEmpty');
    const content = byId('playerContent');
    if (!videoBox || !empty || !content) return;
    if (!video) { videoBox.hidden = true; content.hidden = true; empty.hidden = false; return; }

    videoBox.hidden = false;
    empty.hidden = true;
    content.hidden = false;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(video.id)}?rel=0&modestbranding=1${state.autoplay ? '&autoplay=1' : ''}`;
    iframe.title = `Player: ${video.title}`;
    iframe.loading = 'eager';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    videoBox.innerHTML = '';
    videoBox.appendChild(iframe);
    byId('playerEyebrow').textContent = video.category;
    byId('playerTitle').textContent = video.title;
    byId('playerDescription').textContent = video.description;
    const favorite = byId('playerFavorite');
    favorite.textContent = state.favorites.has(video.id) ? '♥ Nos favoritos' : '♡ Favoritar';
    favorite.onclick = () => { toggleFavorite(video.id); favorite.textContent = state.favorites.has(video.id) ? '♥ Nos favoritos' : '♡ Favoritar'; };
    byId('openDetails').href = detailUrl(video.id);
    byId('openYoutube').href = youtubeUrl(video.id);
    document.title = `${video.title} — Player NERDFLIX`;
    renderCards(byId('recommendationsGrid'), CATALOG.filter(item => item.id !== video.id).slice(0, 4));
  }

  function renderConfig() {
    const nameInput = byId('profileName');
    const languageInput = byId('profileLanguage');
    const autoplayInput = byId('autoplayToggle');
    const thumbSizeInput = byId('thumbSizeSelect');
    if (!nameInput || !autoplayInput || !thumbSizeInput) return;
    nameInput.value = state.profile.name;
    languageInput.value = state.profile.language;
    autoplayInput.checked = state.autoplay;
    thumbSizeInput.value = state.thumbSize;

    const paletteList = byId('configPaletteList');
    PALETTES.forEach(palette => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'palette-card';
      button.dataset.paletteCard = palette.name;
      button.setAttribute('aria-pressed', 'false');
      button.innerHTML = `<span class="palette-swatch" style="--swatch:${palette.accent};--swatch-strong:${palette.strong}"></span><span><strong>${palette.label}</strong><small>${palette.name}</small></span>`;
      button.addEventListener('click', () => applyAccent(palette.name));
      paletteList.appendChild(button);
    });
    applyAccent(state.accent, false);

    byId('profileForm')?.addEventListener('submit', event => {
      event.preventDefault();
      state.profile = { name: nameInput.value.trim() || DEFAULT_PROFILE.name, language: languageInput.value };
      storage.setJSON(STORAGE.profile, state.profile);
      queryAll('[data-profile-name]').forEach(el => { el.textContent = state.profile.name; });
      showToast('Perfil salvo neste navegador.');
    });
    byId('resetProfile')?.addEventListener('click', () => { nameInput.value = DEFAULT_PROFILE.name; languageInput.value = DEFAULT_PROFILE.language; });
    autoplayInput.addEventListener('change', () => { state.autoplay = autoplayInput.checked; storage.set(STORAGE.autoplay, String(state.autoplay)); showToast(state.autoplay ? 'Autoplay ativado.' : 'Autoplay desativado.'); });
    thumbSizeInput.addEventListener('change', () => applyThumbSize(thumbSizeInput.value));
    byId('themeSelect')?.addEventListener('change', event => applyTheme(event.target.value));
    if (byId('themeSelect')) byId('themeSelect').value = state.theme;
    byId('resetPreferences')?.addEventListener('click', () => { applyTheme('dark'); applyAccent('vermelho'); applyThumbSize('normal'); state.autoplay = false; autoplayInput.checked = false; storage.set(STORAGE.autoplay, 'false'); showToast('Preferências restauradas.'); });
  }

  function openDialog(dialog) {
    if (!dialog) return;
    dialog.hidden = false;
    document.body.classList.add('dialog-open');
    query('button, [href], input, select', dialog)?.focus();
  }
  function closeDialog(dialog) {
    if (!dialog) return;
    dialog.hidden = true;
    document.body.classList.remove('dialog-open');
  }

  let retroTimeout = null;
  function activateRetroMode() {
    if (body.classList.contains('retro-mode')) return;
    body.classList.add('retro-mode');
    const banner = document.createElement('div');
    banner.className = 'retro-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML = '<strong>Modo retrô desbloqueado</strong><span>Pressione Esc para sair.</span><button type="button" aria-label="Fechar modo retrô">×</button>';
    banner.querySelector('button').addEventListener('click', deactivateRetroMode);
    document.body.appendChild(banner);
    retroTimeout = setTimeout(deactivateRetroMode, 5 * 60 * 1000);
  }
  function deactivateRetroMode() {
    body.classList.remove('retro-mode');
    document.querySelector('.retro-banner')?.remove();
    if (retroTimeout) { clearTimeout(retroTimeout); retroTimeout = null; }
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      queryAll('[data-dialog]').forEach(dialog => { if (!dialog.hidden) closeDialog(dialog); });
      if (body.classList.contains('retro-mode')) deactivateRetroMode();
      query('#mobileNav')?.classList.remove('is-open');
    }
  });

  setupGlobalUI();
  if (page === 'home') renderHome();
  if (page === 'details') renderDetails();
  if (page === 'player') renderPlayer();
  if (page === 'config') renderConfig();
})();
