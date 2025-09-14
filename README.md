# NERDFLIX — Manual do Projeto

## 1. Resumo
NERDFLIX é uma página web inspirada em plataformas de streaming, projetada para exibir vídeos do YouTube de forma organizada e interativa. A aplicação possui um player embutido, carrosséis horizontais de miniaturas (thumbs), campo de busca, alternância de temas (claro/escuro), seletor de paletas de cores, e um modo retrô como easter-egg. O projeto prioriza acessibilidade, responsividade e facilidade de manutenção.

---

## 2. Estrutura de arquivos
- **index.html**: contém a marcação completa, incluindo cabeçalho, controles, player, seções de vídeos, modal de seleção de paletas e rodapé.  
- **styles.css**: define o estilo visual, variáveis CSS para temas e paletas, layout responsivo e efeitos do modo retrô.  
- **script.js**: gerencia a lógica de interação, incluindo clique em thumbnails, busca, toggle de tamanho de thumbnails, alternância de tema, seleção de paletas, persistência em `localStorage` e easter-egg retrô.

---

## 3. Funcionalidades

### 3.1 Player e Miniaturas
- O player principal é um **iframe** do YouTube, atualizado automaticamente ao clicar em uma miniatura.  
- Suporte a teclado: miniaturas podem ser ativadas utilizando as teclas `Enter` ou `Space`.

### 3.2 Busca e Filtros
- A barra de busca filtra miniaturas em tempo real, considerando `href`, `data-title` e atributo `alt` das imagens.  
- A busca inclui um easter-egg que ativa o modo retrô ao digitar "nerdflix".

### 3.3 Layout e Interface
- Toggle de tamanho das miniaturas, permitindo aumentar ou reduzir a visualização.  
- Carrosséis horizontais em cada seção, com rolagem suave.  
- Botão de acesso a playlist completa para cada seção.

### 3.4 Temas e Paletas de Cores
- Alternância entre temas claro e escuro, com persistência em `localStorage`.  
- Modal de seleção de paletas com visualização prévia de cores.  
- Alteração de cores principais da interface (variáveis CSS: `--accent`, `--accent-strong`, `--thumb-hover-border`).

### 3.5 Modo Retrô (Easter-Egg)
- Ativado ao digitar "nerdflix" no campo de busca.  
- Altera a aparência do site com tipografia monospace, scanlines, pixelização das miniaturas e cores neon.  
- Inclui banner informativo e pode ser desativado via `Esc` ou botão de fechamento.  
- Configurado para desligar automaticamente após cinco minutos.

### 3.6 Acessibilidade
- Suporte a navegação por teclado nos controles e miniaturas.  
- Modal de paletas mantém foco acessível (focus trapping mínimo).  
- Elementos semânticos e ARIA foram aplicados para melhor experiência de usuários com deficiência.

---

## 4. Persistência de Preferências
- `nerdflix-theme`: define tema atual (`light` ou `dark`).  
- `nerdflix-accent`: define a paleta de cores escolhida.  
- Estas preferências são carregadas automaticamente ao iniciar a página.

---

## 5. Customização
- **Paletas de cores**: localizadas no `script.js` na array `palettes`, cada objeto define `{ name, label, accent, accentStrong, thumbBorder }`.  
- **Miniaturas e vídeos**: adicionar novos vídeos é feito no HTML com a seguinte estrutura:
  ```html
  <a class="thumb" href="#" data-video="https://www.youtube.com/embed/VIDEOID?rel=0" data-title="Título do vídeo">
    <img src="https://i.ytimg.com/vi/VIDEOID/hqdefault.jpg" alt="Descrição do vídeo">
  </a>
