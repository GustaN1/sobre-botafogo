const Parser = require('rss-parser');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const parser = new Parser();

// Função para buscar imagem e texto completo da página original
async function extrairConteudoCompleto(urlOriginal) {
  try {
    // Faz a requisição HTTP para a página da notícia
    const { data: html } = await axios.get(urlOriginal, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 5000 // Cancela se demorar mais de 5s para não travar o script
    });

    const $ = cheerio.load(html);

    // 1. Pega a imagem principal das metatags OpenGraph (og:image)
    let imagem = $('meta[property="og:image"]').attr('content') || 
                 $('meta[name="twitter:image"]').attr('content') ||
                 "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80"; // fallback

    // 2. Extrai os parágrafos de texto da notícia
    let paragrafos = [];
    $('article p, .content p, .texto p, main p').each((_, el) => {
      const texto = $(el).text().trim();
      // Filtra parágrafos muito curtos ou propagandas
      if (texto.length > 40 && !texto.toLowerCase().includes('leia mais') && !texto.toLowerCase().includes('inscreva-se')) {
        paragrafos.push(`<p>${texto}</p>`);
      }
    });

    const conteudoHTML = paragrafos.length > 0 
      ? paragrafos.slice(0, 5).join('') // Pega até 5 parágrafos principais
      : null;

    return { imagem, conteudoHTML };
  } catch (error) {
    return { imagem: null, conteudoHTML: null };
  }
}

async function buscarNoticias() {
  console.log("🔄 Buscando e raspando as notícias mais recentes...");

  try {
    const feed = await parser.parseURL('https://news.google.com/rss/search?q=Botafogo+futebol&hl=pt-BR&gl=BR&ceid=BR:pt-419');
    const itensSelecionados = feed.items.slice(0, 6);
    const noticiasAtualizadas = [];

    for (let index = 0; index < itensSelecionados.length; index++) {
      const item = itensSelecionados[index];
      
      // Extrai o título e a fonte original (Ex: "Título da Matéria - Globo Esporte")
      const partesTitulo = item.title.split(' - ');
      const fonte = partesTitulo.length > 1 ? partesTitulo.pop() : "Portal de Notícias";
      const tituloLimpo = partesTitulo.join(' - ');

      console.log(`[${index + 1}/6] Processando: ${tituloLimpo}...`);

      // Tenta raspar o conteúdo real e a foto
      const { imagem, conteudoHTML } = await extrairConteudoCompleto(item.link);

      // Texto de fallback caso o site da fonte bloqueie o robô
      const textoFinal = conteudoHTML || `<p>${item.contentSnippet || item.title}</p>`;
      const imagemFinal = imagem || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80";

      noticiasAtualizadas.push({
        id: index + 1,
        categoria: "Últimas",
        categoria_slug: "bastidores",
        titulo: tituloLimpo,
        data: new Date(item.pubDate).toLocaleDateString('pt-BR'),
        imagem: imagemFinal,
        resumo: item.contentSnippet || "Confira todos os detalhes sobre esta notícia do Glorioso.",
        conteudo: `${textoFinal}<p style="margin-top: 1.5rem; font-size: 0.85rem; color: #666; font-style: italic;">Fonte das informações: ${fonte}</p>`
      });
    }

    fs.writeFileSync('./data/noticias.json', JSON.stringify(noticiasAtualizadas, null, 2));
    console.log('⚡ data/noticias.json atualizado com texto completo, imagens reais e fonte textual!');

  } catch (error) {
    console.error('Erro ao processar as notícias:', error);
  }
}

buscarNoticias();