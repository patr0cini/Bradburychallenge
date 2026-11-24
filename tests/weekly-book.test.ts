import { describe, expect, it } from 'vitest';
import type { Author } from '../src/site/authors.ts';
import type { Book } from '../src/site/books.ts';
import { candidates, weekNumber, weeklyBook } from '../src/site/weekly-book.ts';

const author = (slug: string): Author => ({ name: slug, slug, sortKey: slug, readings: [] });
const book = (isbn13: string): Book => ({ title: `t${isbn13}`, isbn13 });
const books = { a: [book('1'), book('2')], b: [book('3')], fora: [book('4')] };
const authors = [author('a'), author('b')];

describe('livro da semana', () => {
  it('as semanas começam à segunda-feira', () => {
    expect(weekNumber('2026-11-23')).toBe(weekNumber('2026-11-29')); // segunda a domingo
    expect(weekNumber('2026-11-30')).toBe(weekNumber('2026-11-23') + 1);
  });

  it('só entram livros de autores que o site já leu', () => {
    expect(candidates(books, authors).map((c) => c.book.isbn13)).toEqual(['1', '2', '3']);
  });

  it('o mesmo livro durante a semana e roda todas as semanas', () => {
    const mon = weeklyBook(books, authors, '2026-11-23');
    expect(weeklyBook(books, authors, '2026-11-27')).toEqual(mon);
    const seen = new Set(['2026-11-23', '2026-11-30', '2026-12-07'].map((d) => weeklyBook(books, authors, d)?.book.isbn13));
    expect(seen.size).toBe(3);
  });

  it('sem candidatos não há livro', () => {
    expect(weeklyBook({}, authors, '2026-11-23')).toBeUndefined();
  });
});
