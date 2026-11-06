// Autores: índice A–Z e uma página por autor, com todas as leituras que já tiveram no site.
import type { Reading, SiteDay } from './data.js';

export interface AuthorReading {
  date: string;
  reading: Reading;
}

export interface Author {
  name: string;
  slug: string;
  /** Chave de ordenação: apelido, depois o nome completo ("wells h. g. wells"). */
  sortKey: string;
  /** Do mais recente para o mais antigo. */
  readings: AuthorReading[];
}

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** "Ngũgĩ wa Thiong'o" → "ngugi-wa-thiongo". */
export const authorSlug = (name: string) =>
  fold(name)
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Textos com vários autores ("Jules Geller & Robert Darnton") contam para cada um. */
export const splitAuthors = (author: string) =>
  author
    .split(/\s+&\s+/)
    .map((a) => a.trim())
    .filter(Boolean);

const SUFFIX = /^(jr|sr|ii|iii|iv)\.?$/i;

function sortKey(name: string) {
  const words = fold(name).split(/\s+/).filter((w) => !SUFFIX.test(w));
  return `${words.at(-1) ?? ''} ${fold(name)}`;
}

/** Primeira letra do apelido, para os grupos do índice ("#" se não for uma letra). */
export const authorLetter = (a: Author) => (/^[a-z]/.test(a.sortKey) ? a.sortKey[0]!.toUpperCase() : '#');

/** Todos os autores dos dias dados, por ordem alfabética do apelido. */
export function authorsOf(days: SiteDay[]): Author[] {
  const bySlug = new Map<string, Author>();
  for (const day of [...days].sort((a, b) => b.date.localeCompare(a.date))) {
    for (const reading of day.readings) {
      for (const name of splitAuthors(reading.author)) {
        const slug = authorSlug(name);
        if (!slug) continue;
        const author = bySlug.get(slug) ?? { name, slug, sortKey: sortKey(name), readings: [] };
        author.readings.push({ date: day.date, reading });
        bySlug.set(slug, author);
      }
    }
  }
  return [...bySlug.values()].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export const AUTHORS_PATH = '/authors/';
export const authorPath = (name: string) => `${AUTHORS_PATH}${authorSlug(name)}/`;
