// Acrescenta ao data/schedule.json a seleção dos dias que faltam, desde START_DATE até hoje
// (fuso Europe/Lisbon). Os dias já gravados nunca são alterados e os dias futuros nunca são gerados.
//   npm run schedule                         até hoje
//   npm run schedule -- --date 2026-11-03    até esse dia (gera também os anteriores em falta)
//   npm run schedule -- --dry-run            mostra a seleção sem gravar
//   npm run schedule -- --no-refresh         não tenta atualizar catálogos esgotados
//   npm run schedule -- --date 2026-10-21 --replace poem
//                                            troca a leitura dessa categoria num dia já gravado, quando a
//                                            ligação deixou de funcionar (as outras duas ficam iguais)
import { parseArgs } from 'node:util';
import { SELECTION_SEED, START_DATE } from '../src/config.js';
import { loadCatalog } from '../src/lib/catalog.js';
import { runCollection } from '../src/lib/collector.js';
import { dateRange, isoDateInLisbon, isValidIsoDate } from '../src/lib/dates.js';
import { log } from '../src/lib/log.js';
import { loadSchedule, saveSchedule } from '../src/lib/schedule.js';
import { isExhausted, selectDay, type Catalogs } from '../src/lib/selection.js';
import { CATEGORIES, type Category } from '../src/lib/types.js';

const { values } = parseArgs({
  options: {
    date: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    'no-refresh': { type: 'boolean', default: false },
    replace: { type: 'string' },
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

if (values.replace) {
  const category = values.replace as Category;
  if (!CATEGORIES.includes(category)) throw new Error(`Categoria inválida: ${values.replace} (${CATEGORIES.join(', ')})`);
  if (!values.date) throw new Error('--replace precisa de --date');
  const day = schedule[target];
  if (!day) throw new Error(`${target} ainda não tem seleção gravada`);
  const old = day[category];
  // Escolhe como se fosse um dia novo, mas sem o texto que está a ser trocado.
  const without = { ...catalogs, [category]: catalogs[category].filter((i) => i.id !== old.id) };
  const { day: fresh, warnings } = selectDay(target, without, schedule, SELECTION_SEED);
  for (const w of warnings) log('warn', 'schedule', `${target} ${w}`);
  schedule[target] = { ...day, [category]: fresh[category] };
  log('info', 'schedule', `${target} ${category}: ${old.title} (${old.author}) → ${fresh[category].title} (${fresh[category].author})`);
  if (!values['dry-run']) saveSchedule(schedule);
  process.exit(0);
}
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
