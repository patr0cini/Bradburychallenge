import { load } from 'cheerio';
import type { CollectResult, Source, SourceContext } from '../lib/types.js';
import { fixAllCaps } from '../lib/text.js';

// Poetry International (Roterdão). Só poemas escritos originalmente em inglês (filtro lang=English).
const BASE = 'https://www.poetryinternational.com';
const LIST = `${BASE}/en/poets-poems/poems?lang=English`;
const MAX_PAGES = 400;
const PER_PAGE = 24;

export function parsePoetryInternationalList(html: string) {
  const $ = load(html);
  return $('.pe--poem a')
    .map((_, a) => {
      const href = $(a).attr('href') ?? '';
      return {
        url: href.startsWith('http') ? href : BASE + href,
        title: fixAllCaps($(a).find('.introblock-title').text().replace(/\s+/g, ' ').trim()),
        author: $(a).find('.introblock-author').text().replace(/\s+/g, ' ').trim(),
      };
    })
    .get()
    .filter((p) => p.url.includes('/poems/poem/') && p.title && p.author);
}

/** Última página, a partir do total indicado na lista ("3917 poems", 24 por página). */
export function poetryInternationalLastPage(html: string): number | null {
  const m = html.match(/([\d.,]+)\s+poems/);
  if (!m) return null;
  const total = Number(m[1]!.replace(/[.,]/g, ''));
  return total > 0 ? Math.ceil(total / PER_PAGE) : null;
}

export const poetryInternational: Source = {
  id: 'poetryinternational',
  name: 'Poetry International',
  siteName: 'Poetry International',
  categories: ['poem'],

  async collect(ctx: SourceContext): Promise<CollectResult> {
    const result: CollectResult = { items: [], stillListed: [], complete: false };
    let lastPage = MAX_PAGES;
    let failedPages = 0;
    for (let page = 1; page <= lastPage; page++) {
      const html = await ctx.fetchText(`${LIST}&p=${page}`);
      if (page === 1) lastPage = Math.min(poetryInternationalLastPage(html) ?? MAX_PAGES, MAX_PAGES);
      const poems = parsePoetryInternationalList(html);
      if (poems.length === 0) {
        // Página vazia antes da última: falha, não fim da lista.
        if (page < lastPage) {
          failedPages++;
          ctx.log(`página ${page} sem poemas (a última é a ${lastPage}); a recolha fica incompleta`);
          continue;
        }
        break;
      }
      let allKnown = true;
      for (const p of poems) {
        if (ctx.knownUrls.has(p.url)) result.stillListed!.push(p.url);
        else {
          allKnown = false;
          result.items.push({ category: 'poem', ...p, paywalled: false });
        }
      }
      // Lista ordenada do mais recente para o mais antigo: numa recolha incremental,
      // uma página inteira já conhecida significa que não há mais novidades.
      if (ctx.lastRun && allKnown) return result;
    }
    result.complete = failedPages === 0;
    return result;
  },
};
