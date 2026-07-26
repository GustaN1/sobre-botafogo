const Parser = require('rss-parser');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

// Extrai texto e imagem direto do site de origem
async function extrairMateriaCompleta(url) {
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9'
      },
      timeout: 6000
    });

    const $ = cheerio.load(html);

    // 1. Pega a Imagem da capa real (og:image)
    let imagem = $('meta[property="og:image"]').attr('content') || 
                 $('meta[name="twitter:image"]').attr('content');

    // 2. Extrai os parágrafos reais do artigo
    let paragrafos = [];
    
    $('article p, .mc-article-body p, .content-text__container, .entry-content p, main p').each((_, el) => {
      const texto = $(el).text().trim();
      
      // Filtra frases curtas, avisos de cookies ou propagandas
      if (
        texto.length > 50 && 
        !texto.toLowerCase().includes('leia mais') && 
        !texto.toLowerCase().includes('siga o') &&
        !texto.toLowerCase().includes('inscreva-se') &&
        !texto.toLowerCase().includes('assine')
      ) {
        paragrafos.push(`<p style="margin-bottom: 1.2rem; line-height: 1.6;">${texto}</p>`);
      }
    });

    return { 
      imagem: imagem || null, 
      conteudoHTML: paragrafos.length > 0 ? paragrafos.slice(0, 8).join('') : null 
    };
  } catch (error) {
    return { imagem: null, conteudoHTML: null };
  }
}

async function buscarNoticias() {
  console.log("🔄 Buscando matérias completas e imagens reais...");

  try {
    const feed = await parser.parseURL('https://ge.globo.com/rss/ge/futebol/times/botafogo/');
    const itens = feed.items.slice(0, 6);
    const noticiasAtualizadas = [];

    for (let i = 0; i < itens.length; i++) {
      const item = itens[i];
      console.log(`[${i + 1}/6] Baixando: ${item.title}...`);

      const { imagem, conteudoHTML } = await extrairMateriaCompleta(item.link);

      // Tratamento de Imagem Fallback
      const imagemFinal = imagem || 
                          (item.mediaContent && item.mediaContent.$.url) || 
                          "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80";

      // Tratamento de Conteúdo Fallback
      const conteudoFinal = conteudoHTML || `<p style="margin-bottom: 1.2rem; line-height: 1.6;">${item.contentSnippet || item.content || item.title}</p>`;

      noticiasAtualizadas.push({
        id: i + 1,
        categoria: "Notícias",
        categoria_slug: "noticias",
        titulo: item.title,
        data: new Date(item.pubDate).toLocaleDateString('pt-BR'),
        imagem: imagemFinal,
        resumo: item.contentSnippet ? item.contentSnippet.slice(0, 140) + '...' : "Confira os detalhes da matéria sobre o Glorioso.",
        conteudo: `${conteudoFinal}<p style="margin-top: 2rem; font-size: 0.85rem; color: #777; font-style: italic;">Fonte das informações: ge.globo</p>`
      });
    }

    fs.writeFileSync('./data/noticias.json', JSON.stringify(noticiasAtualizadas, null, 2));
    console.log('⚡ Noticias atualizadas com sucesso! Texto completo e fotos carregadas.');

  } catch (error) {
    console.error('Erro ao atualizar notícias:', error);
  }
}

buscarNoticias();