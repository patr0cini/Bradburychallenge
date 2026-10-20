import type { Category, CollectedItem, CollectResult, Source, SourceContext } from '../lib/types.js';
import { accessFromHtml } from '../lib/access.js';
import { htmlToText } from '../lib/text.js';
import { afterParam, wpPages } from './wordpress.js';

// The New York Review of Books. A API REST indica a forma de cada texto (class_list:
// article-form-poem, article-type-essay, article-form-review...) e o autor (parsely).
// O acesso livre vem da página de cada texto; só os gratuitos podem ser escolhidos.
const API = 'https://www.nybooks.com/wp-json/wp/v2/article';
const CAT_LITERATURE = 18757;
const CAT_POETRY = 18759;

interface NyArticle {
  link: string;
  title: { rendered: string };
  class_list: string[];
  parsely?: { meta?: { author?: { name?: string }[] } };
}

export function nybooksCategory(classes: string[], queried: Category): Category | null {
  const set = new Set(classes);
  if (queried === 'poem' && set.has('article-form-poem')) return 'poem';
  // Só ensaios propriamente ditos; as recensões de livros ficam de fora.
  if (queried === 'essay' && set.has('article-type-essay') && !set.has('article-form-poem')) return 'essay';
  return null;
}

/**
 * Nos poemas traduzidos, a NYRB lista o poeta seguido dos tradutores como autores.
 * Nos ensaios, vários nomes são coautores.
 */
export function nybooksAuthors(a: Pick<NyArticle, 'parsely'>, category: Category) {
  const names = (a.parsely?.meta?.author ?? []).map((p) => p.name?.trim()).filter((n): n is string => !!n);
  if (category === 'poem' && names.length > 1)
    return { author: names[0]!, translator: names.slice(1).join(', ') };
  return { author: names.join(' & '), translator: undefined };
}

export const nybooks: Source = {
  id: 'nybooks',
  name: 'The New York Review of Books',
  siteName: 'The New York Review of Books',
  categories: ['poem', 'essay'],

  async collect(ctx: SourceContext): Promise<CollectResult> {
    const items: CollectedItem[] = [];
    const stillListed: string[] = [];
    const queries: [Category, number][] = [
      ['poem', CAT_POETRY],
      ['essay', CAT_LITERATURE],
    ];
    for (const [category, cat] of queries) {
      const params = { categories: cat, _fields: 'link,title,class_list,parsely', ...afterParam(ctx.lastRun) };
      for await (const page of wpPages<NyArticle>(ctx, API, params)) {
        for (const a of page) {
          if (nybooksCategory(a.class_list, category) !== category) continue;
          const title = htmlToText(a.title.rendered);
          // "Two Poems", "Three Poems by ...": vários poemas num só texto.
          if (category === 'poem' && /\bpoems\b/i.test(title)) continue;
          if (ctx.knownUrls.has(a.link)) {
            stillListed.push(a.link);
            continue;
          }
          const { author, translator } = nybooksAuthors(a, category);
          if (!author) continue;
          // Grande parte do arquivo é só para assinantes: a página declara-o (isAccessibleForFree).
          let paywalled: boolean | null = null;
          try {
            const free = accessFromHtml(await ctx.fetchText(a.link));
            paywalled = free === null ? null : !free;
          } catch (e) {
            ctx.log(`não foi possível verificar o acesso de ${a.link}: ${e}`);
          }
          items.push({ category, title, author, translator, url: a.link, paywalled });
        }
      }
    }
    return { items, stillListed, complete: !ctx.lastRun };
  },
};
