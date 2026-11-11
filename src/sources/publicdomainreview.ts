import type { CollectedItem, CollectResult, Source, SourceContext } from '../lib/types.js';

// The Public Domain Review: ensaios sobre história, arte, ciência e literatura, todos gratuitos.
//
// Os termos do site proíbem "spider, crawl, or scrape", por isso a fonte esteve em curadoria
// manual. O editor-chefe, Adam Green, autorizou por email a recolha automática dos ensaios
// (novembro de 2026): "Yes please do feel free to use our essays for this, and automating it is
// fine." Ver docs/verificacao-fontes.md.
//
// O site é feito em Gatsby: um único pedido ao JSON da página /essays/ traz todos os ensaios, com
// título, autores e slug. Não se pedem as páginas de cada ensaio nem as imagens.
const SITE = 'https://publicdomainreview.org';
export const PDR_ESSAYS_DATA = `${SITE}/page-data/essays/page-data.json`;

export interface PdrEssay {
  Title?: string;
  Slug?: string;
  Contributors?: { data?: { Name?: string } }[] | null;
}

interface PdrPageData {
  result?: { data?: { allAirtable?: { totalCount?: number; edges?: { node?: { data?: PdrEssay } }[] } } };
}

export const pdrEssayUrl = (slug: string) => `${SITE}/essay/${slug}/`;

/** Um ensaio da lista, ou null se faltar título, slug ou autor. Vários autores ficam "A & B". */
export function pdrItem(e: PdrEssay): CollectedItem | null {
  const title = e.Title?.trim();
  const slug = e.Slug?.trim();
  const author = (e.Contributors ?? [])
    .map((c) => c.data?.Name?.trim())
    .filter((n): n is string => !!n)
    .join(' & ');
  if (!title || !slug || !author) return null;
  return { category: 'essay', title, author, url: pdrEssayUrl(slug), paywalled: false };
}

export const publicDomainReview: Source = {
  id: 'publicdomainreview',
  name: 'The Public Domain Review (ensaios, com autorização)',
  siteName: 'The Public Domain Review',
  categories: ['essay'],

  async collect(ctx: SourceContext): Promise<CollectResult> {
    const page = await ctx.fetchJson<PdrPageData>(PDR_ESSAYS_DATA);
    const list = page.result?.data?.allAirtable;
    const edges = list?.edges ?? [];
    const result: CollectResult = { items: [], excluded: [], complete: false };
    for (const edge of edges) {
      const e = edge.node?.data ?? {};
      const item = pdrItem(e);
      if (item) result.items.push(item);
      else if (e.Slug) result.excluded!.push({ url: pdrEssayUrl(e.Slug), reason: 'sem título ou sem autor' });
    }
    // Só é completa se veio a lista inteira: senão, uma resposta cortada desativaria ensaios.
    result.complete = edges.length > 0 && edges.length === list?.totalCount;
    ctx.log(`${result.items.length} ensaios de ${list?.totalCount ?? '?'}`);
    return result;
  },
};
