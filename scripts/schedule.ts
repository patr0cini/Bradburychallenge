// Acrescenta ao data/schedule.json a seleção dos dias que faltam, desde START_DATE até hoje
// (fuso Europe/Lisbon). Os dias já gravados nunca são alterados e os dias futuros nunca são gerados.
//   npm run schedule                         até hoje
//   npm run schedule -- --date 2026-11-03    até esse dia (gera também os anteriores em falta)
//   npm run schedule -- --dry-run            mostra a seleção sem gravar
//   npm run schedule -- --no-refresh         não tenta atualizar catálogos esgotados
import { parseArgs } from 'node:util';
import { SELECTION_SEED, START_DATE } from '../src/config.js';
import { loadCatalog } from '../src/lib/catalog.js';
import { runCollection } from '../src/lib/collector.js';
import { dateRange, isoDateInLisbon, isValidIsoDate } from '../src/lib/dates.js';
import { log } from '../src/lib/log.js';
import { loadSchedule, saveSchedule } from '../src/lib/schedule.js';
import { isExhausted, selectDay, type Catalogs } from '../src/lib/selection.js';
import { CATEGORIES } from '../src/lib/types.js';

const { values } = parseArgs({
  options: {
    date: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    'no-refresh': { type: 'boolean', default: false },
  },
});

const today = isoDateInLisbon();
const target = values.date ?? today;
if (!isValidIsoDate(target)) throw new Error(`Data inválida: ${target}`);
if (target > today) {
  log('error', 'schedule', `${target} é um dia futuro (hoje é ${today} em Lisboa); os dias futuros não são gerados`);
  process.exit(1);
}
if (target < START_DATE) {
  log('info', 'schedule', `${target} é anterior à data de início (${START_DATE}); nada a fazer`);
  process.exit(0);
}

const loadCatalogs = (): Catalogs => Object.fromEntries(CATEGORIES.map((c) => [c, loadCatalog(c)])) as Catalogs;
let catalogs = loadCatalogs();
const schedule = loadSchedule();
const refreshed = new Set<string>();

for (const date of dateRange(START_DATE, target)) {
  if (schedule[date]) continue;

  // Catálogo esgotado: tenta primeiro atualizá-lo a partir das fontes (uma vez por execução).
  if (!values['no-refresh'] && !values['dry-run']) {
    for (const category of CATEGORIES) {
      if (refreshed.has(category) || !isExhausted(catalogs[category], schedule, category, date)) continue;
      refreshed.add(category);
      log('warn', 'schedule', `${category}: sem textos por estrear; a tentar atualizar o catálogo`);
      const { added } = await runCollection({ category, force: true });
      log('info', 'schedule', `${category}: ${added} textos novos`);
      catalogs = loadCatalogs();
    }
  }

  const { day, warnings } = selectDay(date, catalogs, schedule, SELECTION_SEED);
  for (const w of warnings) log('warn', 'schedule', `${date} ${w}`);
  schedule[date] = day;
  log('info', 'schedule', `${date}: ${CATEGORIES.map((c) => `${day[c].title} (${day[c].author})`).join(' | ')}`);
  if (!values['dry-run']) saveSchedule(schedule);
}
