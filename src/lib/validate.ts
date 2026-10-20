import type { CatalogItem } from './types.js';
import { canonicalUrl, dedupeKey } from './text.js';

/** Problemas estruturais de um catálogo: campos em falta, ids e URLs repetidos, duplicados ativos. */
export function findProblems(items: CatalogItem[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const urls = new Map<string, string>();
  const keys = new Map<string, string>();
  for (const i of items) {
    for (const f of ['id', 'title', 'author', 'url', 'source', 'firstSeen'] as const)
      if (!i[f]) problems.push(`${i.id || '(sem id)'}: falta o campo ${f}`);
    if (ids.has(i.id)) problems.push(`${i.id}: id repetido`);
    ids.add(i.id);
    try {
      const u = canonicalUrl(i.url);
      if (urls.has(u)) problems.push(`${i.id}: mesmo URL que ${urls.get(u)}`);
      urls.set(u, i.id);
    } catch {
      problems.push(`${i.id}: URL inválido (${i.url})`);
    }
    if (i.active) {
      const k = dedupeKey(i.title, i.author);
      if (keys.has(k)) problems.push(`${i.id}: mesmo título e autor que ${keys.get(k)}`);
      keys.set(k, i.id);
    }
  }
  return problems;
}
