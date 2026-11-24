// Livros de cada autor, para a secção "Books" das páginas de autor: data/books.json, por slug do autor.
// Só entram edições disponíveis e conhecidas; o ISBN-13 é validado aqui e a ligação à Amazon usa o ISBN-10.
import { join } from 'node:path';
import { DATA_DIR, readJson } from '../lib/catalog.js';
import { isbn13Valid } from './isbn.js';

export interface Book {
  title: string;
  /** Autor ou tradutor/editor quando convém ("Penguin Classics, trans. M. A. Screech"). */
  by?: string;
  isbn13: string;
}

export const BOOKS_FILE = join(DATA_DIR, 'books.json');

export function cleanBooks(raw: unknown): Record<string, Book[]> {
  const out: Record<string, Book[]> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [slug, list] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(list)) continue;
    const books = list.filter(
      (b): b is Book => !!b && typeof b.title === 'string' && b.title.trim() !== '' && typeof b.isbn13 === 'string' && isbn13Valid(b.isbn13),
    );
    if (books.length) out[slug] = books.map((b) => ({ title: b.title.trim(), isbn13: b.isbn13.replace(/[-\s]/g, ''), ...(b.by ? { by: b.by } : {}) }));
  }
  return out;
}

export const loadBooks = (path = BOOKS_FILE) => cleanBooks(readJson<unknown>(path, {}));
