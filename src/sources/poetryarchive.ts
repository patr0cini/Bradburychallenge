import { load } from 'cheerio';
import type { CollectResult, Source, SourceContext } from '../lib/types.js';

// Poetry Archive (Reino Unido). robots.txt: crawl-delay 10.
// Cada página de poeta lista os poemas desse poeta.
const POETS_SITEMAP = 'https://poetryarchive.org/poets-sitemap.xml';

export function parsePoetryArchivePoetPage(html: string) {
  const $ = load(html);
  const author = $('h1.f-area-title').first().text().replace(/\s+/g, ' ').trim();
  const seen = new Set<string>();
  const poems: { title: string; url: string }[] = [];
  $('.poem-list .poem-title h3 a').each((_, a) => {
    const url = $(a).attr('href') ?? '';
    const title = $(a).text().replace(/\s+/g, ' ').trim();
    if (!url.includes('/poem/') || !title || seen.has(url)) return;
    seen.add(url);
    poems.push({ title, url });
  });
  return { author, poems };
}

export const poetryArchive: Source = {
  id: 'poetryarchive',
  name: 'Poetry Archive',
  siteName: 'Poetry Archive',
  categories: ['poem'],

  async collect(ctx: SourceContext): Promise<CollectResult> {
    const xml = await ctx.fetchText(POETS_SITEMAP);
    const poets = [...xml.matchAll(/<loc>([^<]+\/poet\/[^<]+)<\/loc>/g)].map((m) => m[1]!);
    ctx.log(`${poets.length} páginas de poeta`);
    const result: CollectResult = { items: [], complete: true };
    for (const [i, poetUrl] of poets.entries()) {
      if (i % 50 === 0) ctx.log(`poeta ${i + 1}/${poets.length}`);
      try {
        const { author, poems } = parsePoetryArchivePoetPage(await ctx.fetchText(poetUrl));
        if (!author) continue;
        for (const p of poems) result.items.push({ category: 'poem', title: p.title, author, url: p.url, paywalled: false });
      } catch (e) {
        result.complete = false;
        ctx.log(`falhou ${poetUrl}: ${e}`);
      }
    }
    return result;
  },
};
