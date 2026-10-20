// Verifica, na página de cada texto, se é de acesso livre (schema.org isAccessibleForFree)
// e atualiza o campo `paywalled` no catálogo. Só os textos gratuitos podem ser escolhidos.
//   npm run check-access -- --source nybooks --source lrb
//   npm run check-access -- --source nybooks --only-unknown   só os que ainda não foram verificados
// As fontes correm em paralelo; dentro de cada site os pedidos respeitam o crawl-delay.
import { parseArgs } from 'node:util';
import { accessFromHtml } from '../src/lib/access.js';
import { loadCatalog, saveCatalog } from '../src/lib/catalog.js';
import { PoliteClient } from '../src/lib/http.js';
import { log } from '../src/lib/log.js';
import { CATEGORIES, type CatalogItem } from '../src/lib/types.js';

const { values } = parseArgs({
  options: { source: { type: 'string', multiple: true }, 'only-unknown': { type: 'boolean', default: false } },
});
if (!values.source?.length) {
  console.error('Indicar pelo menos uma fonte: --source <id>');
  process.exit(1);
}

const client = new PoliteClient();
const results = new Map<string, boolean | null>(); // id -> paywalled

await Promise.all(
  values.source.map(async (source) => {
    const items: CatalogItem[] = CATEGORIES.flatMap((c) => loadCatalog(c)).filter(
      (i) => i.source === source && i.active && (!values['only-unknown'] || i.paywalled === null),
    );
    log('info', 'check-access', `${source}: ${items.length} textos a verificar`);
    let free = 0;
    for (const [n, item] of items.entries()) {
      if (n > 0 && n % 100 === 0) log('info', 'check-access', `${source}: ${n}/${items.length} (${free} gratuitos até agora)`);
      try {
        const access = accessFromHtml(await client.text(item.url));
        results.set(item.id, access === null ? null : !access);
        if (access === true) free++;
      } catch (e) {
        log('warn', 'check-access', `${item.url}: ${e}`);
      }
    }
    log('info', 'check-access', `${source}: ${free} de ${items.length} são de acesso livre`);
  }),
);

// Grava no fim, relendo os catálogos para não perder alterações feitas entretanto.
for (const category of CATEGORIES) {
  const catalog = loadCatalog(category);
  let changed = 0;
  for (const item of catalog) {
    if (!results.has(item.id)) continue;
    const paywalled = results.get(item.id)!;
    if (item.paywalled !== paywalled) changed++;
    item.paywalled = paywalled;
  }
  if (changed) saveCatalog(category, catalog);
  log('info', 'check-access', `${category}: ${changed} textos com o acesso atualizado`);
}
