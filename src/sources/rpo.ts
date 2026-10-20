import { load } from 'cheerio';
import type { CollectResult, Source, SourceContext } from '../lib/types.js';
import { invertName } from '../lib/text.js';

// Representative Poetry Online, Universidade de Toronto.
// Percorre as páginas de poeta do sitemap; cada uma tem o "Index to poems".
const BASE = 'https://rpo.library.utoronto.ca';

export async function rpoPoetUrls(ctx: SourceContext): Promise<string[]> {
  const urls = new Set<string>();
  for (let page = 1; page <= 20; page++) {
    let xml: string;
    try {
      xml = await ctx.fetchText(`${BASE}/sitemap.xml?page=${page}`);
    } catch (e) {
      // O sitemap tem um número variável de páginas; a seguir à última vem um 404.
      if (page > 1 && String(e).includes('HTTP 404')) break;
      throw e;
    }
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
    if (locs.length === 0) break;
    for (const loc of locs) if (/\/poets\/[^/]+$/.test(loc)) urls.add(loc.replace(/^http:/, 'https:'));
  }
  return [...urls];
}

export function parseRpoPoetPage(html: string) {
  const $ = load(html);
  const author = invertName($('h1.title a').first().text() || $('h1.title').first().text());
  const poems = $('ol.poet-titles-list li a')
    .map((_, a) => ({ title: $(a).text().replace(/\s+/g, ' ').trim(), url: BASE + $(a).attr('href') }))
    .get()
    .filter((p) => p.title && p.url.includes('/content/'));
  return { author, poems };
}

/** Páginas do índice de poetas que não são poetas (prémios, antologias). */
export const NOT_A_POET = /\b(prize|award|anthology|competition)\b/i;

export const rpo: Source = {
  id: 'rpo',
  name: 'Representative Poetry Online',
  siteName: 'Representative Poetry Online (University of Toronto)',
  categories: ['poem'],

  async collect(ctx: SourceContext): Promise<CollectResult> {
    const poets = await rpoPoetUrls(ctx);
    ctx.log(`${poets.length} páginas de poeta`);
    const result: CollectResult = { items: [], complete: true };
    let failures = 0;
    for (const [i, poetUrl] of poets.entries()) {
      if (i % 50 === 0) ctx.log(`poeta ${i + 1}/${poets.length}`);
      try {
        const { author, poems } = parseRpoPoetPage(await ctx.fetchText(poetUrl));
        if (!author || NOT_A_POET.test(author)) continue;
        for (const p of poems) result.items.push({ category: 'poem', title: p.title, author, url: p.url, paywalled: false });
      } catch (e) {
        failures++;
        ctx.log(`falhou ${poetUrl}: ${e}`);
      }
    }
    // Com falhas, a lista não é completa: não desativar poemas por engano.
    if (failures > 0) result.complete = false;
    return result;
  },
};
