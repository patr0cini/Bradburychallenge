import { describe, expect, it } from 'vitest';
import { pdrItem, publicDomainReview, PDR_ESSAYS_DATA } from '../src/sources/publicdomainreview.js';
import type { SourceContext } from '../src/lib/types.js';

const essay = (Slug: string, Title: string, ...names: string[]) => ({
  node: { data: { Slug, Title, Contributors: names.map((Name) => ({ data: { Name } })) } },
});

function ctx(data: unknown, requested: string[] = []): SourceContext {
  return {
    async fetchText() {
      throw new Error('não usado');
    },
    async fetchJson<T>(url: string) {
      requested.push(url);
      return data as T;
    },
    log() {},
    knownUrls: new Set(),
  };
}

describe('The Public Domain Review', () => {
  it('lê título, autores e ligação de cada ensaio', () => {
    expect(pdrItem({ Title: 'Veronese’s Dogs', Slug: 'veroneses-dogs', Contributors: [{ data: { Name: 'Ann Smith' } }] })).toEqual({
      category: 'essay',
      title: 'Veronese’s Dogs',
      author: 'Ann Smith',
      url: 'https://publicdomainreview.org/essay/veroneses-dogs/',
      paywalled: false,
    });
    expect(pdrItem(essay('a', 'A', 'X', 'Y').node.data)?.author).toBe('X & Y');
    expect(pdrItem({ Title: 'Sem autor', Slug: 'sem-autor', Contributors: [] })).toBeNull();
  });

  it('faz um só pedido e só marca a recolha como completa se veio a lista inteira', async () => {
    const requested: string[] = [];
    const edges = [essay('a', 'A', 'X'), essay('b', 'B'), essay('c', 'C', 'Z')];
    const full = await publicDomainReview.collect(ctx({ result: { data: { allAirtable: { totalCount: 3, edges } } } }, requested));
    expect(requested).toEqual([PDR_ESSAYS_DATA]);
    expect(full.items.map((i) => i.title)).toEqual(['A', 'C']);
    expect(full.excluded).toEqual([{ url: 'https://publicdomainreview.org/essay/b/', reason: 'sem título ou sem autor' }]);
    expect(full.complete).toBe(true);

    const cut = await publicDomainReview.collect(ctx({ result: { data: { allAirtable: { totalCount: 347, edges } } } }));
    expect(cut.complete).toBe(false);
    expect((await publicDomainReview.collect(ctx({}))).complete).toBe(false);
  });
});
