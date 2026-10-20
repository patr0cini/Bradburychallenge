import { load } from 'cheerio';
import { accessFromHtml } from '../lib/access.js';
import type { CollectResult, Source, SourceContext } from '../lib/types.js';

// London Review of Books. robots.txt: para `*` só bloqueia /Media/; os bloqueios de /the-paper/
// aplicam-se apenas a bots de IA. Os termos não proíbem a recolha (ver docs/verificacao-fontes.md).
//
// Duas listas cruzadas:
// - /subjects/literature-and-criticism (paginada, do mais recente para o mais antigo):
//   diz que textos são de literatura;
// - o índice de cada número (/the-paper/vNN/nNN): dá autor e título e diz se o texto é uma
//   recensão (tem o livro recenseado). Como na NYRB, ficam só os textos que não são recensões.
const BASE = 'https://www.lrb.co.uk';
const SUBJECT = `${BASE}/subjects/literature-and-criticism`;
const MAX_SUBJECT_PAGES = 600;

const ARTICLE_PATH = /^\/the-paper\/(v\d+\/n\d+)\/[^/]+\/[^/]+$/;

export function parseLrbSubjectPage(html: string): string[] {
  const $ = load(html);
  const urls = new Set<string>();
  // Só os blocos da lista (.block-item), não a navegação do site.
  $('.block-item a[href^="/the-paper/"]').each((_, a) => {
    const href = ($(a).attr('href') ?? '').split(/[?#]/)[0]!;
    if (ARTICLE_PATH.test(href)) urls.add(BASE + href);
  });
  return [...urls];
}

export interface LrbTocEntry {
  url: string;
  author: string;
  title: string;
  isReview: boolean;
}

export function parseLrbIssueToc(html: string): LrbTocEntry[] {
  const $ = load(html);
  return $('a.toc-item')
    .map((_, a) => {
      const href = ($(a).attr('href') ?? '').split(/[?#]/)[0]!;
      const h4 = $(a).find('h4').first();
      return {
        url: BASE + href,
        author: $(a).find('h3').first().text().replace(/\s+/g, ' ').trim(),
        title: h4.text().replace(/\s+/g, ' ').trim(),
        isReview: h4.find('.article-reviewed-item').length > 0,
      };
    })
    .get()
    .filter((e) => ARTICLE_PATH.test(new URL(e.url).pathname) && e.author && e.title);
}

/**
 * Tipo do texto na página do artigo: a LRB marca o contentor com `type--essay`,
 * `type--poems`, `type--review`, etc. Só `essay` interessa.
 */
export function lrbArticleType(html: string): string | null {
  const m = html.match(/paperArticle-container[^"]*\btype--([a-z-]+)/);
  return m ? m[1]! : null;
}

/** Secções que não são ensaios (filtro barato, antes de abrir a página). */
const NOT_AN_ESSAY = /^(letters|short cuts|poem|story|at the [^:]+:)/i;

export const issueOf = (url: string) => new URL(url).pathname.match(ARTICLE_PATH)?.[1];

export const lrb: Source = {
  id: 'lrb',
  name: 'London Review of Books',
  siteName: 'London Review of Books',
  categories: ['essay'],

  async collect(ctx: SourceContext): Promise<CollectResult> {
    const result: CollectResult = { items: [], excluded: [], stillListed: [], complete: false };

    // 1. Textos de literatura ainda não conhecidos.
    const literature = new Set<string>();
    for (let page = 1; page <= MAX_SUBJECT_PAGES; page++) {
      const urls = parseLrbSubjectPage(await ctx.fetchText(page === 1 ? SUBJECT : `${SUBJECT}?page=${page}`));
      if (urls.length === 0) {
        result.complete = true;
        break;
      }
      const fresh = urls.filter((u) => !ctx.knownUrls.has(u));
      urls.filter((u) => ctx.knownUrls.has(u)).forEach((u) => result.stillListed!.push(u));
      fresh.forEach((u) => literature.add(u));
      if (page % 25 === 0) ctx.log(`página ${page} da lista de literatura (${literature.size} textos novos)`);
      // Numa recolha incremental, uma página só com textos conhecidos encerra a lista.
      if (ctx.lastRun && fresh.length === 0) break;
    }
    // Numa recolha incremental a lista não foi percorrida até ao fim.
    if (ctx.lastRun) result.complete = false;

    // 2. Índices dos números onde aparecem esses textos.
    const candidates: LrbTocEntry[] = [];
    const issues = [...new Set([...literature].map(issueOf).filter((i): i is string => !!i))].sort().reverse();
    ctx.log(`${literature.size} textos novos de literatura em ${issues.length} números`);
    for (const [n, issue] of issues.entries()) {
      if (n % 50 === 0) ctx.log(`número ${n + 1}/${issues.length}`);
      let toc: LrbTocEntry[];
      try {
        toc = parseLrbIssueToc(await ctx.fetchText(`${BASE}/the-paper/${issue}`));
      } catch (e) {
        ctx.log(`falhou o índice ${issue}: ${e}`);
        result.complete = false;
        continue;
      }
      for (const entry of toc) {
        if (!literature.has(entry.url)) continue;
        literature.delete(entry.url);
        if (entry.isReview) result.excluded!.push({ url: entry.url, reason: 'recensão' });
        else if (NOT_AN_ESSAY.test(entry.title)) result.excluded!.push({ url: entry.url, reason: 'secção que não é ensaio' });
        else candidates.push(entry);
      }
    }
    // 3. A página de cada candidato diz se é um ensaio (os poemas não estão marcados no índice).
    ctx.log(`${candidates.length} candidatos a ensaio; a confirmar o tipo em cada página`);
    for (const entry of candidates) {
      let type: string | null;
      let free: boolean | null;
      try {
        const html = await ctx.fetchText(entry.url);
        type = lrbArticleType(html);
        free = accessFromHtml(html);
      } catch (e) {
        ctx.log(`falhou ${entry.url}: ${e}`);
        result.complete = false;
        continue;
      }
      // O arquivo da LRB é quase todo só para assinantes; a página declara-o (isAccessibleForFree).
      if (type === 'essay')
        result.items.push({ category: 'essay', title: entry.title, author: entry.author, url: entry.url, paywalled: free === null ? null : !free });
      else result.excluded!.push({ url: entry.url, reason: `tipo ${type ?? 'desconhecido'}, não ensaio` });
    }

    // Textos da lista de literatura que não aparecem em nenhum índice.
    for (const url of literature) result.excluded!.push({ url, reason: 'não encontrado no índice do número' });
    return result;
  },
};
