import { describe, expect, it } from 'vitest';
import { cleanBooks, loadBooks } from '../src/site/books.js';
import { isbn13To10, isbn13Valid } from '../src/site/isbn.js';

describe('ISBN', () => {
  it('valida o dígito de controlo do ISBN-13', () => {
    expect(isbn13Valid('9780140430486')).toBe(true);
    expect(isbn13Valid('978-0-14-043048-6')).toBe(true);
    expect(isbn13Valid('9780140430487')).toBe(false);
    expect(isbn13Valid('12345')).toBe(false);
  });

  it('converte para ISBN-10, o código que a Amazon usa nos livros', () => {
    expect(isbn13To10('9780140430486')).toBe('0140430482');
    expect(isbn13To10('9780306406157')).toBe('0306406152');
    expect(isbn13To10('9780199540792')).toMatch(/^019954079[\dX]$/);
    expect(isbn13To10('9791234567896')).toBeUndefined();
    expect(isbn13To10('9780140430487')).toBeUndefined();
  });
});

describe('livros por autor', () => {
  it('descarta entradas sem título ou com ISBN inválido', () => {
    expect(
      cleanBooks({
        'charles-lamb': [{ title: ' Essays of Elia ', isbn13: '978-0-14-043048-6' }, { title: 'Sem ISBN válido', isbn13: '9780140430487' }, { isbn13: '9780140430486' }],
        vazio: [],
        'não-lista': 'x',
      }),
    ).toEqual({ 'charles-lamb': [{ title: 'Essays of Elia', isbn13: '9780140430486' }] });
    expect(cleanBooks(null)).toEqual({});
  });

  it('todos os livros de data/books.json têm ISBN-13 válido e não se repetem por autor', () => {
    const books = loadBooks();
    for (const [slug, list] of Object.entries(books)) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      expect(new Set(list.map((b) => b.isbn13)).size, slug).toBe(list.length);
      for (const b of list) expect(isbn13Valid(b.isbn13), `${slug}: ${b.title}`).toBe(true);
    }
  });
});
