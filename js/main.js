document.addEventListener('DOMContentLoaded', () => {
  const newsContainer = document.getElementById('news-container');
  const pageTitle = document.getElementById('page-title');

  // Pega o parâmetro "cat" da URL (ex: index.html?cat=mercado)
  const urlParams = new URLSearchParams(window.location.search);
  const currentCategory = urlParams.get('cat');

  // Destaca a aba selecionada no menu
  const activeNavId = currentCategory ? `nav-${currentCategory}` : 'nav-todas';
  const activeNav = document.getElementById(activeNavId);
  if (activeNav) {
    activeNav.classList.add('active');
  }

  if (newsContainer) {
    fetch('data/noticias.json')
      .then(response => response.json())
      .then(data => {
        // Filtra os dados se houver categoria selecionada
        const filteredNews = currentCategory
          ? data.filter(n => n.categoria_slug === currentCategory)
          : data;

        // Atualiza o título da página
        if (pageTitle) {
          if (currentCategory && filteredNews.length > 0) {
            pageTitle.innerText = filteredNews[0].categoria;
          } else if (currentCategory && filteredNews.length === 0) {
            pageTitle.innerText = 'Nenhuma notícia encontrada nesta categoria';
          } else {
            pageTitle.innerText = 'Últimas Notícias';
          }
        }

        // Renderiza os cards
        if (filteredNews.length > 0) {
          newsContainer.innerHTML = filteredNews.map(noticia => `
            <a href="noticia.html?id=${noticia.id}" style="text-decoration: none; color: inherit;">
              <article class="card">
                <img src="${noticia.imagem}" alt="${noticia.titulo}">
                <div class="card-body">
                  <span class="card-tag">${noticia.categoria}</span>
                  <h3 class="card-title">${noticia.titulo}</h3>
                  <p style="font-size: 0.9rem; margin-bottom: 0.8rem; color: var(--text-muted);">${noticia.resumo}</p>
                  <span class="card-date">${noticia.data}</span>
                </div>
              </article>
            </a>
          `).join('');
        } else {
          newsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 3rem 0;">Nenhuma publicação encontrada.</p>';
        }
      })
      .catch(error => {
        console.error('Erro ao carregar dados:', error);
        newsContainer.innerHTML = '<p>Erro ao carregar as notícias.</p>';
      });
  }
});