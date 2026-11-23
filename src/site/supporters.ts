// Amigos do projeto que pediram para aparecer na página de apoio: data/supporters.json é uma lista de nomes.
// Só se acrescenta um nome com o consentimento da pessoa (ver docs/amigos.md).
import { join } from 'node:path';
import { DATA_DIR, readJson } from '../lib/catalog.js';

export const SUPPORTERS_FILE = join(DATA_DIR, 'supporters.json');

/** Nomes sem espaços a mais, sem vazios nem repetidos, por ordem alfabética. */
export function cleanSupporters(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const names = raw.filter((n): n is string => typeof n === 'string').map((n) => n.replace(/\s+/g, ' ').trim().slice(0, 60)).filter(Boolean);
  const byKey = new Map<string, string>();
  for (const n of names) if (!byKey.has(n.toLowerCase())) byKey.set(n.toLowerCase(), n); // fica a primeira grafia
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}

export const loadSupporters = (path = SUPPORTERS_FILE) => cleanSupporters(readJson<unknown>(path, []));
