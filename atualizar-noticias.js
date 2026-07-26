const Parser = require('rss-parser');
const fs = require('fs');
const parser = new Parser();

async function buscarNoticias() {
  try {
    // 1. Busca o feed público do Google News focado em Botafogo
    const feed = await parser.parseURL('https://news.google.com/rss/search?q=Botafogo+futebol&hl=pt-BR&gl=BR&ceid=BR:pt-419');
    
    // 2. Pega apenas as 6 matérias mais recentes e apaga qualquer sobra antiga
    const noticiasAtualizadas = feed.items.slice(0, 6).map((item, index) => {
      // Limpa o nome do portal no final do título do Google News (ex: "Título - Globo Esporte" vira apenas "Título")
      const tituloLimpo = item.title.split(' - ')[0];

      return {
        id: index + 1,
        categoria: "Últimas",
        categoria_slug: "bastidores",
        titulo: tituloLimpo,
        data: new Date(item.pubDate).toLocaleDateString('pt-BR'),
        imagem: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80",
        resumo: item.contentSnippet || "Confira a matéria completa no portal de origem.",
        conteudo: `<p>${item.contentSnippet || item.title}</p><p style="margin-top: 1.5rem;"><a href="${item.link}" target="_blank" rel="noopener noreferrer" style="font-weight: bold; color: var(--accent-black);">→ Clique aqui para ler a matéria completa na fonte original</a></p>`
      };
    });

    // 3. Sobrescreve o arquivo data/noticias.json (zerando as antigas)
    fs.writeFileSync('./data/noticias.json', JSON.stringify(noticiasAtualizadas, null, 2));
    console.log('⚡ data/noticias.json foi limpo e atualizado apenas com as notícias mais recentes!');

  } catch (error) {
    console.error('Erro ao atualizar notícias:', error);
  }
}

buscarNoticias();