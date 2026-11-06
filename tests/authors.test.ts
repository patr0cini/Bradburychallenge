import { describe, expect, it } from 'vitest';
import { authorLetter, authorPath, authorSlug, authorsOf, splitAuthors } from '../src/site/authors.js';
import { matches } from '../src/site/author-search.js';
import type { Reading, SiteDay } from '../src/site/data.js';

const reading = (category: Reading['category'], title: string, author: string): Reading => ({
  id: `${category}:${title}`,
  title,
  author,
  url: `https://example.org/${title}`,
  source: 'x',
  paywalled: false,
  previousUses: 0,
  category,
  siteName: 'Example',
  unavailable: false,
});

const day = (date: string, ...readings: Reading[]): SiteDay => ({ date, number: 1, readings });

describe('autores', () => {
  it('cria slugs sem acentos nem apóstrofos', () => {
    expect(authorSlug("Ngũgĩ wa Thiong'o")).toBe('ngugi-wa-thiongo');
    expect(authorSlug('H. G. Wells')).toBe('h-g-wells');
    expect(authorPath('Oscar Wilde')).toBe('/authors/oscar-wilde/');
  });

  it('separa textos com vários autores', () => {
    expect(splitAuthors('Jules Geller & Robert Darnton')).toEqual(['Jules Geller', 'Robert Darnton']);
    expect(splitAuthors('Oscar Wilde')).toEqual(['Oscar Wilde']);
  });

  it('junta as leituras de cada autor, da mais recente para a mais antiga, por ordem do apelido', () => {
    const authors = authorsOf([
      day('2026-10-20', reading('poem', 'A', 'Oscar Wilde'), reading('essay', 'B', 'Jules Geller & Robert Darnton')),
      day('2026-10-21', reading('story', 'C', 'Oscar Wilde'), reading('essay', 'D', 'Martin Luther King Jr.')),
    ]);
    expect(authors.map((a) => a.name)).toEqual(['Robert Darnton', 'Jules Geller', 'Martin Luther King Jr.', 'Oscar Wilde']);
    const wilde = authors.find((a) => a.slug === 'oscar-wilde')!;
    expect(wilde.readings.map((r) => [r.date, r.reading.title])).toEqual([
      ['2026-10-21', 'C'],
      ['2026-10-20', 'A'],
    ]);
    expect(authorLetter(authors[2]!)).toBe('K');
  });
});

describe('pesquisa de autores', () => {
  it('procura todas as palavras, sem ligar a acentos nem maiúsculas', () => {
    expect(matches('george orwell politics and the english language', 'Orwell')).toBe(true);
    expect(matches('george orwell politics and the english language', 'orwell language')).toBe(true);
    expect(matches('george orwell politics and the english language', 'orwell woolf')).toBe(false);
    expect(matches('jose saramago', 'José')).toBe(true);
  });
});
