import { describe, expect, it } from 'vitest';
import { itemId } from '../src/lib/catalog.js';
import { canonicalUrl } from '../src/lib/text.js';
import { GUTENBERG_ESSAYS, anchorOf, gutenberg, mirrorUrl } from '../src/sources/gutenberg.js';
import { CURATED_ESSAYS } from '../src/sources/wikisource.js';
import type { SourceContext } from '../src/lib/types.js';

describe('ensaios do Project Gutenberg', () => {
  it('cada ensaio tem título, autor e uma ligação própria para o Gutenberg', () => {
    expect(GUTENBERG_ESSAYS.length).toBeGreaterThan(400);
    const ids = new Set(GUTENBERG_ESSAYS.map((e) => itemId('gutenberg', e.url)));
    expect(ids.size).toBe(GUTENBERG_ESSAYS.length);
    for (const e of GUTENBERG_ESSAYS) {
      expect(e.title && e.author && e.work, e.url).toBeTruthy();
      expect(e.url).toMatch(/^https:\/\/www\.gutenberg\.org\/cache\/epub\/\d+\/pg\d+-images\.html/);
      expect(e.title, e.url).not.toMatch(/^(footnotes|contents|preface|index|transcriber)/i);
    }
  });

  it('não repete ensaios que já vêm da Wikisource', () => {
    const key = (a: string, t: string) => `${a}|${t}`.toLowerCase().replace(/[^a-z|]/g, '');
    const ws = new Set(CURATED_ESSAYS.map((e) => key(e.author, e.title)));
    expect(GUTENBERG_ESSAYS.filter((e) => ws.has(key(e.author, e.title)))).toEqual([]);
  });

  it('o fragmento distingue ensaios do mesmo livro, mas só no Gutenberg', () => {
    const book = 'https://www.gutenberg.org/cache/epub/849/pg849-images.html';
    expect(itemId('gutenberg', `${book}#link2H_4_0003`)).not.toBe(itemId('gutenberg', `${book}#link2H_4_0004`));
    expect(canonicalUrl('https://example.org/a/#top')).toBe('https://example.org/a');
  });

  it('confirma os livros no espelho e deixa de fora os ensaios cuja âncora desapareceu', async () => {
    const book = 'https://www.gutenberg.org/cache/epub/849/pg849-images.html';
    expect(mirrorUrl(`${book}#x`)).toBe('https://gutenberg.pglaf.org/cache/epub/849/pg849-images.html');
    expect(anchorOf(`${book}#chap01`)).toBe('chap01');
    expect(anchorOf(`${book}#:~:text=THE%20FLOWER`)).toBeUndefined();
    expect(anchorOf(book)).toBeUndefined();

    const requested: string[] = [];
    const ctx: SourceContext = {
      async fetchText(url) {
        requested.push(url);
        if (url.includes('/10343/')) throw new Error('HTTP 404');
        // Todas as âncoras existem, menos a de um ensaio da Repplier.
        return GUTENBERG_ESSAYS.map((e) => anchorOf(e.url)).filter((a) => a && a !== 'BOOKS_THAT_HAVE_HINDERED_ME').map((a) => `id="${a}"`).join(' ');
      },
      async fetchJson() {
        throw new Error('não usado');
      },
      log() {},
      knownUrls: new Set(),
    };
    const result = await gutenberg.collect(ctx);
    expect(new Set(requested).size).toBe(requested.length);
    expect(requested.every((u) => u.startsWith('https://gutenberg.pglaf.org/'))).toBe(true);
    const lamb = GUTENBERG_ESSAYS.filter((e) => e.author === 'Charles Lamb').length;
    expect(result.excluded).toHaveLength(lamb + 1);
    expect(result.items).toHaveLength(GUTENBERG_ESSAYS.length - lamb - 1);
  });
});
