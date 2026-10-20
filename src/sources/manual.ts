import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Category, CollectedItem, Source } from '../lib/types.js';
import { DATA_DIR, readJson } from '../lib/catalog.js';

/**
 * Fontes com curadoria manual: sites cujos termos proíbem a recolha automática,
 * mas permitem ligações. O dono do projeto escolhe os textos no browser e regista-os
 * em data/manual/<fonte>.json. Este módulo só lê esses ficheiros; não faz pedidos à rede.
 */
export interface ManualFile {
  source: string;
  siteName: string;
  notes?: string;
  items: (Omit<CollectedItem, 'paywalled'> & { paywalled?: boolean | null })[];
}

const MANUAL_DIR = join(DATA_DIR, 'manual');
const VALID: Category[] = ['poem', 'essay', 'story'];

export function manualSources(dir = MANUAL_DIR): Source[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const file = readJson<ManualFile>(join(dir, f), { source: f, siteName: f, items: [] });
      return {
        id: file.source,
        name: `${file.siteName} (curadoria manual)`,
        siteName: file.siteName,
        categories: VALID,
        async collect() {
          const items = file.items
            .filter((i) => VALID.includes(i.category) && i.title && i.author && i.url)
            .map((i) => ({ ...i, paywalled: i.paywalled ?? null }));
          return { items, complete: true };
        },
      } satisfies Source;
    });
}
