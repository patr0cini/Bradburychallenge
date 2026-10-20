import { load } from 'cheerio';
import type { Category, CollectedItem, CollectResult, Source, SourceContext } from '../lib/types.js';
import { htmlToText, stripOuterQuotes } from '../lib/text.js';
import { afterParam, wpPages } from './wordpress.js';

// robots.txt do Lit Hub: crawl-delay 10; /tag/ e pesquisa bloqueados. A API REST é permitida.
// Só poemas e contos. A secção Craft and Advice foi avaliada e posta de parte: são sobretudo
// textos promocionais de autores sobre os próprios livros, abaixo do critério de qualidade.
const API = 'https://lithub.com/wp-json/wp/v2/posts';

const CATEGORY_IDS: Partial<Record<Category, number>> = {
  poem: 43077, // fictionandpoetry/poem
  story: 43075, // fictionandpoetry/short-story
};

interface WpPost {
  link: string;
  title: { rendered: string };
  class_list: string[];
}

const NAME = String.raw`(\p{Lu}[\p{L}.'’-]*(?:\s+(?:de|van|von|da|del|le|la|\p{Lu}[\p{L}.'’-]*)){1,4})`;

/** Título do WordPress em texto, com <br> convertido em espaço. */
export function wpTitle(rendered: string): string {
  return htmlToText(rendered.replace(/<br\s*\/?>/gi, ' '));
}

/** Vários poemas num só texto, antologias ou artigos sobre poesia. */
const NOT_A_SINGLE_POEM = /\b(poems|anthology)\b/i;

/**
 * Títulos de poemas com autor:
 *   “X,” a Poem by Y | Read “X,” a New Poem by Y | “X.” A Poem by Y | “X” A Prose Poem by Y | “X” by Y
 */
export function parsePoemTitle(raw: string): { title: string; author: string } | null {
  const t = raw.replace(/\s+/g, ' ').trim();
  if (NOT_A_SINGLE_POEM.test(t)) return null;
  const m =
    t.match(
      new RegExp(String.raw`^(?:Read\s+)?[“"](.+?)[”"][,.:]?\s*[,.:—–-]?\s*an?\s+(?:New\s+)?(?:Prose\s+)?Poem\s+(?:by|from)\s+${NAME}$`, 'iu'),
    ) ?? t.match(new RegExp(String.raw`^[“"](.+?)[”"]\s+by\s+${NAME}$`, 'u'));
  if (!m) return null;
  // A pontuação final dentro das aspas (“Meow.”) pertence à frase, não ao título.
  return { title: stripOuterQuotes(m[1]!).replace(/[,.:]$/, ''), author: m[2]!.trim() };
}

/** Título que é só o nome do texto entre aspas: “The Round”. O autor está na página. */
export function quotedOnlyTitle(raw: string): string | null {
  const t = raw.replace(/\s+/g, ' ').trim();
  const m = t.match(/^[“"]([^“”"]+)[”"]$/);
  return m ? stripOuterQuotes(m[1]!) : null;
}

/** Byline das páginas: "By Hiroko Oyamada (trans. Lucy North)" ou "A Poem by Stanley Kunitz". */
export function parseByline(text: string): { author: string; translator?: string } | null {
  const m = text
    .replace(/\s+/g, ' ')
    .trim()
    .match(/^(?:An?\s+(?:New\s+)?(?:Prose\s+)?Poem\s+)?By\s+(.+?)(?:\s*\((?:trans(?:lated)?\.?(?:\s+by)?)\s+([^)]+)\))?$/i);
  if (!m || /\bpoems\b/i.test(text)) return null;
  // Também aparece "By Yukiko Motoya, trans. Asa Yoneda".
  const inline = m[1]!.match(/^(.+?),\s*trans(?:lated)?\.?(?:\s+by)?\s+(.+)$/i);
  if (inline) return { author: inline[1]!.trim(), translator: inline[2]!.trim() };
  return { author: m[1]!.trim(), translator: m[2]?.trim() };
}

/**
 * Decide se um texto marcado como excerto é um conto completo, pela nota de apresentação
 * ("The following is from X's collection..."). Na dúvida, exclui.
 */
export function excerptVerdict(intro: string): 'story' | 'novel' | 'unknown' {
  if (/\bnovel(la)?\b/i.test(intro)) return 'novel';
  if (/\b(story collection|collection|short stories|stories)\b/i.test(intro)) return 'story';
  return 'unknown';
}

async function readPage(ctx: SourceContext, url: string) {
  const $ = load(await ctx.fetchText(url));
  const byline = parseByline($('.story-info h2').first().text());
  const intro = $('.story-info .excerpt').first().text();
  return { byline, intro };
}

export const lithub: Source = {
  id: 'lithub',
  name: 'Literary Hub',
  siteName: 'Lit Hub',
  categories: ['poem', 'story'],

  async collect(ctx: SourceContext): Promise<CollectResult> {
    const items: CollectedItem[] = [];
    const excluded: { url: string; reason: string }[] = [];
    const stillListed: string[] = [];
    const exclude = (url: string, reason: string) => excluded.push({ url, reason });

    for (const category of this.categories) {
      const params = { categories: CATEGORY_IDS[category]!, _fields: 'link,title,class_list', ...afterParam(ctx.lastRun) };
      for await (const page of wpPages<WpPost>(ctx, API, params)) {
        for (const post of page) {
          if (ctx.knownUrls.has(post.link)) {
            stillListed.push(post.link);
            continue;
          }
          const rawTitle = wpTitle(post.title.rendered);
          const classes = new Set(post.class_list);

          if (category === 'poem') {
            const parsed = parsePoemTitle(rawTitle);
            if (parsed) {
              items.push({ category, ...parsed, url: post.link, paywalled: false });
              continue;
            }
            const title = NOT_A_SINGLE_POEM.test(rawTitle) ? null : quotedOnlyTitle(rawTitle);
            if (!title) {
              exclude(post.link, 'não é um poema individual (conjunto de poemas, artigo ou notícia)');
              continue;
            }
            const { byline } = await readPage(ctx, post.link);
            if (!byline) exclude(post.link, 'autor não identificado');
            else items.push({ category, title, author: byline.author, translator: byline.translator, url: post.link, paywalled: false });
            continue;
          }

          // Contos
          const title = quotedOnlyTitle(rawTitle);
          if (!title) {
            exclude(post.link, 'não é um conto (título sem aspas: notícia, prémio ou apresentação)');
            continue;
          }
          if (classes.has('category-from-the-novel')) {
            exclude(post.link, 'excerto de romance');
            continue;
          }
          const { byline, intro } = await readPage(ctx, post.link);
          if (!byline) {
            exclude(post.link, 'autor não identificado');
            continue;
          }
          if (classes.has('category-excerpts')) {
            const verdict = excerptVerdict(intro);
            if (verdict === 'novel') {
              exclude(post.link, 'excerto de romance');
              continue;
            }
            if (verdict === 'unknown') {
              exclude(post.link, 'excerto de livro sem indicação de que seja um conto completo');
              continue;
            }
          }
          items.push({ category, title, author: byline.author, translator: byline.translator, url: post.link, paywalled: false });
        }
      }
    }
    return { items, excluded, stillListed, complete: !ctx.lastRun };
  },
};
