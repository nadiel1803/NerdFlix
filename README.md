# NERDFLIX

O NERDFLIX é uma interface estática, responsiva e sem backend para organizar e reproduzir vídeos do YouTube. A versão revisada mantém a proposta original, mas agora utiliza uma identidade visual compartilhada, um catálogo centralizado e preferências locais funcionais.

> O projeto não é uma plataforma de streaming real. O catálogo e a reprodução dependem dos vídeos públicos e das permissões de incorporação do YouTube.

## O que foi aprimorado

A revisão eliminou a duplicação de catálogo entre as páginas, retirou a dependência do Tailwind via CDN, conectou todas as telas ao mesmo `styles.css` e ao mesmo `script.js`, substituiu títulos baseados em IDs por metadados legíveis e transformou a tela de configurações em uma área funcional. A aplicação também passou a oferecer busca na home e no catálogo, favoritos persistentes, fallback de thumbnails, temas claro e escuro, paletas de destaque, cards compactos ou grandes, autoplay configurável e estados vazios claros.

## Estrutura

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html` | Home com hero, busca, destaques, coleção e favoritos. |
| `detalhes.html` | Catálogo pesquisável e detalhe contextual do vídeo selecionado. |
| `player.html` | Reprodução do vídeo informado por `?vid=ID`, metadados e recomendações. |
| `config.html` | Perfil local, tema, paleta, autoplay e densidade dos cards. |
| `styles.css` | Identidade visual, componentes, responsividade e acessibilidade. |
| `script.js` | Catálogo, renderização, navegação, estado local e interações. |
| `Assets/` | Imagens enviadas no pacote original e usadas como apoio/fallback. |

## Como editar o catálogo

Abra `script.js` e localize a constante `CATALOG`. Cada objeto representa um vídeo. Para incluir um novo conteúdo, adicione outro objeto com `id`, `title`, `description`, `category`, `type` e `tags`.

```js
{
  id: 'ID_DO_VIDEO',
  title: 'Título que aparecerá no site',
  description: 'Resumo curto do conteúdo.',
  category: 'NOVA COLEÇÃO',
  type: 'Filme',
  tags: ['tema', 'coleção']
}
```

O `id` deve ser o identificador do vídeo no YouTube. O site monta automaticamente a miniatura, o player, o link de detalhes e o link externo para o YouTube.

## Preferências locais

As preferências são salvas usando `localStorage`. Os nomes das chaves são `nerdflix-theme`, `nerdflix-accent`, `nerdflix-thumb-size`, `nerdflix-autoplay`, `nerdflix-favorites` e `nerdflix-profile`. Não há envio de dados para servidor.

## Como executar

Por ser um projeto estático, os arquivos podem ser publicados diretamente em GitHub Pages, Netlify, Vercel ou qualquer servidor que entregue HTML, CSS e JavaScript. Para testar localmente, abra `index.html` no navegador. Para uma experiência mais próxima da produção, use um servidor estático local, como o recurso de servidor do seu editor ou qualquer servidor HTTP simples.

O projeto usa miniaturas e incorporações do YouTube, portanto alguns recursos dependem de conexão com a internet. Se uma miniatura não carregar, o código tenta uma qualidade alternativa e depois apresenta um asset local de fallback.

## Observações de manutenção

Os links internos são relativos e funcionam em hospedagem estática. A reprodução não usa autoplay por padrão, porque navegadores podem bloquear reprodução automática com som. Caso o usuário ative essa preferência, o player acrescenta a solicitação de autoplay ao iframe.

O nome NERDFLIX e os elementos visuais inspirados em serviços conhecidos devem ser tratados como parte de um projeto pessoal ou educacional. Para uma publicação comercial, substitua a identidade visual e utilize somente conteúdo e marcas para os quais você tenha autorização.
