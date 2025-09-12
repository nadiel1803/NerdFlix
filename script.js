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
