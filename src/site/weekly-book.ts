// Livro da semana: um livro de data/books.json, a mudar à segunda-feira, entre os autores que o site já leu.
// Escolha determinística (sem estado): a mesma semana dá sempre o mesmo livro, e o site é reconstruído todos os dias.
import type { Author } from './authors.js';
import type { Book } from './books.js';

export interface WeeklyBook {
  book: Book;
  author: Author;
}

const DAY = 86_400_000;

/** Número da semana desde 1970, com as semanas a começar à segunda-feira (a 1970-01-01 foi quinta). */
export function weekNumber(iso: string): number {
  const days = Math.floor(Date.parse(`${iso}T12:00:00Z`) / DAY);
  return Math.floor((days + 3) / 7);
}

/** Todos os livros candidatos, por ordem estável (autor, depois livro). */
export function candidates(books: Record<string, Book[]>, authors: Author[]): WeeklyBook[] {
  const bySlug = new Map(authors.map((a) => [a.slug, a]));
  return Object.keys(books)
    .sort()
    .flatMap((slug) => {
      const author = bySlug.get(slug);
      return author ? books[slug]!.map((book) => ({ book, author })) : [];
    });
}

export function weeklyBook(books: Record<string, Book[]>, authors: Author[], today: string): WeeklyBook | undefined {
  const list = candidates(books, authors);
  if (!list.length) return undefined;
  return list[weekNumber(today) % list.length];
}
