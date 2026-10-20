import { load } from 'cheerio';
import type { CollectResult, Source, SourceContext } from '../lib/types.js';

// Los Angeles Review of Books. Gratuita ("LARB publishes daily without a paywall").
// robots.txt: para `*` só bloqueia /login/, /api/ e a pesquisa; não há termos de utilização publicados.
// A lista /articles/essays/all/?page=N traz, em cada cartão, título, autores e secções.
// Ficam os ensaios de secções literárias; os outros (política, cinema, ciência...) ficam de fora.
const BASE = 'https://lareviewofbooks.org';
const LIST = `${BASE}/articles/essays/all/`;
const MAX_PAGES = 800;

export const LITERARY_SECTIONS = new Set(['literary-criticism', 'memoir-essay', 'poetry', 'fiction', 'biography-autobiography']);

export interface LarbCard {
  url: string;
  title: string;
  authors: string[];
  sections: string[];
}

export function parseLarbEssayList(html: string): LarbCard[] {
  const $ = load(html);
  const seen = new Set<string>();
  const cards: LarbCard[] = [];
  $('h2 > a[href^="/article/"]').each((_, a) => {
    const href = ($(a).attr('href') ?? '').split(/[?#]/)[0]!;
    if (seen.has(href)) return;
    seen.add(href);
    // O cartão é o maior bloco à volta do título que só contém este artigo.
    let card = $(a).parent();
    while (card.parent().length && card.parent().find('h2 > a[href^="/article/"]').length === 1) card = card.parent();
    const authors = card
      .find('a[href^="/contributor/"]')
      .map((_, c) => $(c).text().replace(/\s+/g, ' ').trim())
      .get()
      .filter(Boolean);
    const sections = card
      .find('a[href^="/sections/"]')
      .map((_, s) => ($(s).attr('href') ?? '').replace(/^\/sections\/|\/$/g, ''))
      .get();
    cards.push({ url: BASE + href, title: $(a).text().replace(/\s+/g, ' ').trim(), authors: [...new Set(authors)], sections: [...new Set(sections)] });
  });
  return cards.filter((c) => c.title);
}

/**
 * Peças criativas publicadas na lista de ensaios: poemas e contos com o título
 * "Autor’s ‘Título’" (ou "From Autor’s “Título”"), em que o nome é o do próprio autor do texto.
 */
export function isCreativePiece(title: string, authors: string[]): boolean {
  const m = title.match(/^(?:From\s+)?(.+?)[’']s?\s+[‘“'"]/i);
  if (!m) return false;
  const possessor = m[1]!.trim().toLowerCase();
  const surname = (name: string) => name.trim().split(/\s+/).at(-1)!.toLowerCase();
  return authors.some((a) => a.toLowerCase() === possessor || surname(a) === possessor.split(/\s+/).at(-1));
}

/** Excertos de livros, conjuntos de poemas, conversas, entrevistas e mesas-redondas. */
export const NOT_AN_ESSAY_TITLE =
  /\b(excerpts?|poems|a conversation|in conversation|conversations? (with|between|on|about)|interview(s|ed)?|roundtable|q&a)\b/i;

/**
 * Confirma, no texto da página, que é prosa de ensaio: pelo menos 8 parágrafos longos e 1000
 * palavras. Alguns poemas aparecem na lista de ensaios com a etiqueta "Essays"; em verso, têm
 * poucos parágrafos longos (só o texto institucional da LARB).
 */
export function larbIsProseEssay(html: string): boolean {
  const $ = load(html);
  const long = $('p')
    .map((_, p) => $(p).text().replace(/\s+/g, ' ').trim())
    .get()
    .filter((t) => t.length > 200);
  const words = long.reduce((n, t) => n + t.split(' ').length, 0);
  return long.length >= 8 && words >= 1000;
}

/** Número da última página da lista, a partir das ligações de paginação ("?page=297"). */
export function larbLastPage(html: string): number | null {
  const pages = [...html.matchAll(/\/articles\/essays\/all\/\?page=(\d+)/g)].map((m) => Number(m[1]));
  return pages.length ? Math.max(...pages) : null;
}

export const larb: Source = {
  id: 'larb',
  name: 'Los Angeles Review of Books',
  siteName: 'Los Angeles Review of Books',
  categories: ['essay'],

  async collect(ctx: SourceContext): Promise<CollectResult> {
    const result: CollectResult = { items: [], excluded: [], stillListed: [], complete: false };
    let lastPage = MAX_PAGES;
    let failedPages = 0;
    const candidates: LarbCard[] = [];
    for (let page = 1; page <= lastPage; page++) {
      const html = await ctx.fetchText(`${LIST}?page=${page}`);
      if (page === 1) lastPage = Math.min(larbLastPage(html) ?? MAX_PAGES, MAX_PAGES);
      const cards = parseLarbEssayList(html);
      if (cards.length === 0) {
        // Uma página vazia antes da última é uma falha, não o fim da lista: não se dá a
        // recolha por completa (senão textos ainda listados seriam marcados como inativos).
        if (page < lastPage) {
          failedPages++;
          ctx.log(`página ${page} sem ensaios (a última é a ${lastPage}); a recolha fica incompleta`);
          continue;
        }
        break;
      }
      if (page % 25 === 0) ctx.log(`página ${page} de ${lastPage} (${result.items.length} ensaios literários até agora)`);
      let fresh = 0;
      for (const c of cards) {
        if (ctx.knownUrls.has(c.url)) {
          result.stillListed!.push(c.url);
          continue;
        }
        fresh++;
        if (!c.sections.some((s) => LITERARY_SECTIONS.has(s)))
          result.excluded!.push({ url: c.url, reason: c.sections.length ? `secção não literária (${c.sections.join(', ')})` : 'sem secção' });
        else if (c.authors.length === 0) result.excluded!.push({ url: c.url, reason: 'autor não identificado' });
        else if (isCreativePiece(c.title, c.authors)) result.excluded!.push({ url: c.url, reason: 'poema ou conto, não ensaio' });
        else if (NOT_AN_ESSAY_TITLE.test(c.title)) result.excluded!.push({ url: c.url, reason: 'excerto, poemas, conversa ou entrevista' });
        else candidates.push(c);
      }
      // Lista do mais recente para o mais antigo: numa recolha incremental, uma página sem
      // novidades encerra a recolha.
      if (ctx.lastRun && fresh === 0) break;
    }
    // Completa só se percorreu todas as páginas sem falhas, numa recolha não incremental.
    result.complete = !ctx.lastRun && failedPages === 0;

    // Confirma na página de cada candidato que é um ensaio em prosa.
    ctx.log(`${candidates.length} candidatos; a confirmar na página de cada um que é um ensaio em prosa`);
    for (const [n, c] of candidates.entries()) {
      if (n > 0 && n % 100 === 0) ctx.log(`${n}/${candidates.length} páginas confirmadas`);
      let prose: boolean;
      try {
        prose = larbIsProseEssay(await ctx.fetchText(c.url));
      } catch (e) {
        ctx.log(`falhou ${c.url}: ${e}`);
        result.complete = false;
        continue;
      }
      if (prose) result.items.push({ category: 'essay', title: c.title, author: c.authors.join(' & '), url: c.url, paywalled: false });
      else result.excluded!.push({ url: c.url, reason: 'não é prosa de ensaio (poema ou texto curto)' });
    }
    return result;
  },
};
