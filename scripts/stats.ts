// Mostra, por categoria e fonte, quantos textos estão ativos e quantos podem ser escolhidos
// (ativos e de acesso livre).
import { loadCatalog } from '../src/lib/catalog.js';
import { isSelectable } from '../src/lib/selection.js';
import { CATEGORIES } from '../src/lib/types.js';

const LABEL = { poem: 'Poemas', essay: 'Ensaios', story: 'Contos' } as const;

for (const category of CATEGORIES) {
  const items = loadCatalog(category);
  const active = items.filter((i) => i.active);
  const selectable = items.filter(isSelectable);
  console.log(`\n${LABEL[category]}: ${selectable.length} selecionáveis (gratuitos) de ${active.length} ativos`);
  const bySource = new Map<string, { active: number; free: number }>();
  for (const i of active) {
    const s = bySource.get(i.source) ?? { active: 0, free: 0 };
    s.active++;
    if (isSelectable(i)) s.free++;
    bySource.set(i.source, s);
  }
  for (const [source, s] of [...bySource].sort((a, b) => b[1].free - a[1].free))
    console.log(`  ${source.padEnd(24)} ${String(s.free).padStart(6)} gratuitos${s.free < s.active ? ` (de ${s.active})` : ''}`);
}
