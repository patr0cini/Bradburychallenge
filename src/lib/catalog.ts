import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { CatalogItem, Category, CollectResult } from './types.js';
import { canonicalUrl, dedupeKey } from './text.js';

// Relativo à raiz do projeto (os comandos npm e o build do Astro correm a partir dela).
export const DATA_DIR = process.env.BRADBURY_DATA_DIR || join(process.cwd(), 'data');

const FILES: Record<Category, string> = {
  poem: 'catalog/poems.json',
  essay: 'catalog/essays.json',
  story: 'catalog/stories.json',
};

export function catalogPath(category: Category, dataDir = DATA_DIR) {
  return join(dataDir, FILES[category]);
}

export function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
}

export function loadCatalog(category: Category, dataDir = DATA_DIR): CatalogItem[] {
  return readJson<CatalogItem[]>(catalogPath(category, dataDir), []);
}

export function saveCatalog(category: Category, items: CatalogItem[], dataDir = DATA_DIR) {
  const sorted = [...items].sort((a, b) => a.id.localeCompare(b.id));
  writeJson(catalogPath(category, dataDir), sorted);
}

export function itemId(source: string, url: string) {
  const u = new URL(canonicalUrl(url));
  return `${source}:${u.hostname.replace(/^www\./, '')}${u.pathname}`;
}

/** Acima disto, desativações numa só recolha são tratadas como suspeitas. */
const MAX_DEACTIVATIONS_SHARE = 0.1;
const MAX_DEACTIVATIONS_ABSOLUTE = 20;

export interface MergeStats {
  added: number;
  updated: number;
  deactivated: number;
  /** Desativações suspeitas (demasiadas de uma vez) que não foram aplicadas. */
  suspiciousDeactivations: number;
  /** Textos novos com o mesmo título e autor de outro já no catálogo. */
  skippedDuplicates: number;
}

/**
 * Junta o resultado de uma fonte ao catálogo de uma categoria.
 * - Textos novos entram com firstSeen = hoje.
 * - Textos já conhecidos atualizam metadados e lastSeen. firstSeen e id nunca mudam.
 * - Se a recolha foi completa, os textos desta fonte que já não aparecem ficam active=false.
 * - Um texto com o mesmo título e autor de outro já ativo no catálogo não entra (fica o primeiro),
 *   venha de outra fonte ou da mesma (o mesmo poema em dois URLs, partes de uma sequência).
 */
export function mergeIntoCatalog(
  catalog: CatalogItem[],
  source: string,
  category: Category,
  result: CollectResult,
  today: string,
): { catalog: CatalogItem[]; stats: MergeStats } {
  const stats: MergeStats = { added: 0, updated: 0, deactivated: 0, suspiciousDeactivations: 0, skippedDuplicates: 0 };
  const byId = new Map(catalog.map((i) => [i.id, { ...i }]));
  const activeKeys = new Set(catalog.filter((i) => i.active).map((i) => dedupeKey(i.title, i.author)));
  const seen = new Set<string>();

  for (const item of result.items) {
    if (item.category !== category) continue;
    const id = itemId(source, item.url);
    if (seen.has(id)) continue;
    seen.add(id);
    const existing = byId.get(id);
    if (existing) {
      Object.assign(existing, item, { id, source, firstSeen: existing.firstSeen, lastSeen: today, active: true });
      stats.updated++;
      continue;
    }
    const key = dedupeKey(item.title, item.author);
    if (activeKeys.has(key)) {
      stats.skippedDuplicates++;
      continue;
    }
    activeKeys.add(key);
    byId.set(id, { ...item, id, source, firstSeen: today, lastSeen: today, active: true });
    stats.added++;
  }

  for (const url of result.stillListed ?? []) {
    const id = itemId(source, url);
    const existing = byId.get(id);
    if (existing && existing.category === category) {
      seen.add(id);
      existing.lastSeen = today;
      existing.active = true;
    }
  }

  // Textos que a fonte viu e excluiu explicitamente (poema em vez de ensaio, excerto...):
  // desativados sempre, porque não é uma falha de recolha.
  const excludedIds = new Set((result.excluded ?? []).map((x) => itemId(source, x.url)));
  for (const entry of byId.values()) {
    if (entry.source === source && entry.category === category && entry.active && excludedIds.has(entry.id) && !seen.has(entry.id)) {
      entry.active = false;
      stats.deactivated++;
      seen.add(entry.id);
    }
  }

  if (result.complete) {
    const missing = [...byId.values()].filter((e) => e.source === source && e.category === category && e.active && !seen.has(e.id));
    const activeBefore = catalog.filter((e) => e.source === source && e.category === category && e.active).length;
    // Rede de segurança: uma recolha "completa" que deixa de ver muitos textos de uma vez é mais
    // provavelmente uma falha (página vazia, site mudado) do que uma remoção real. Não desativa.
    if (missing.length > Math.max(MAX_DEACTIVATIONS_ABSOLUTE, activeBefore * MAX_DEACTIVATIONS_SHARE)) {
      stats.suspiciousDeactivations = missing.length;
    } else {
      for (const entry of missing) entry.active = false;
      stats.deactivated += missing.length;
    }
  }

  return { catalog: [...byId.values()], stats };
}
