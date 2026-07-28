document.addEventListener('DOMContentLoaded', () => {
  const newsContainer = document.getElementById('news-container');

  if (newsContainer) {
    fetch('data/noticias.json')
      .then(response => {
        if (!response.ok) throw new Error('Erro ao buscar notícias');
        return response.json();
      })
      .then(data => {
        if (data && data.length > 0) {
          newsContainer.innerHTML = data.map(noticia => `
            <a href="noticia.html?id=${noticia.id}" style="text-decoration: none; color: inherit;">
              <article class="card">
                <img src="${noticia.imagem}" alt="${noticia.titulo}" loading="lazy">
                <div class="card-body">
                  <span class="card-tag">${noticia.categoria || 'Notícias'}</span>
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
        newsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 3rem 0;">Erro ao carregar as notícias. Tente novamente mais tarde.</p>';
      });
  }
});