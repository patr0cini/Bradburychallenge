// Valida os catálogos.
//   npm run validate                 estrutura, campos obrigatórios e duplicados
//   npm run validate -- --urls       verifica também se os URLs respondem (lento: respeita o crawl-delay)
//   npm run validate -- --urls --sample 50   verifica só uma amostra aleatória por categoria
import { parseArgs } from 'node:util';
import { PoliteClient } from '../src/lib/http.js';
import { loadCatalog } from '../src/lib/catalog.js';
import { findProblems } from '../src/lib/validate.js';
import { CATEGORIES } from '../src/lib/types.js';

const { values } = parseArgs({
  options: { urls: { type: 'boolean', default: false }, sample: { type: 'string' } },
});

let total = 0;
for (const category of CATEGORIES) {
  const items = loadCatalog(category);
  const problems = findProblems(items);
  total += problems.length;
  console.log(`${category}: ${items.length} entradas, ${problems.length} problemas`);
  for (const p of problems.slice(0, 30)) console.log(`  - ${p}`);
  if (problems.length > 30) console.log(`  ... e mais ${problems.length - 30}`);

  if (values.urls) {
    const client = new PoliteClient();
    let pool = items.filter((i) => i.active);
    if (values.sample) pool = pool.sort(() => Math.random() - 0.5).slice(0, Number(values.sample));
    // Pedidos alternados entre sites, para o crawl-delay de cada um correr em paralelo.
    const results = await Promise.all(
      pool.map((i) =>
        client.get(i.url).then(
          () => null,
          (e) => `${i.id}: ${e instanceof Error ? e.message : e}`,
        ),
      ),
    );
    const broken = results.filter(Boolean);
    total += broken.length;
    console.log(`  URLs verificados: ${pool.length}, com erro: ${broken.length}`);
    for (const b of broken) console.log(`  - ${b}`);
  }
}
process.exitCode = total > 0 ? 1 : 0;
