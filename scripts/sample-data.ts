// Gera dados de exemplo em data/sample/ para desenvolver a interface antes do lançamento:
// 45 dias de seleção até hoje, com os catálogos reais e o algoritmo real, mais notas de exemplo
// (claramente marcadas como tal) e alguns casos difíceis: título muito longo e texto que
// deixou de estar disponível.
//   npm run sample
//   BRADBURY_DATA_SET=sample npm run dev
import { join } from 'node:path';
import { SELECTION_SEED } from '../src/config.js';
import { DATA_DIR, loadCatalog, writeJson } from '../src/lib/catalog.js';
import { addDays, dateRange, isoDateInLisbon } from '../src/lib/dates.js';
import { saveSchedule } from '../src/lib/schedule.js';
import { selectDay, type Catalogs, type Schedule } from '../src/lib/selection.js';
import { CATEGORIES } from '../src/lib/types.js';

const DIR = join(DATA_DIR, 'sample');
const DAYS = 45;
const today = isoDateInLisbon();
const start = addDays(today, -(DAYS - 1));

const catalogs = Object.fromEntries(CATEGORIES.map((c) => [c, loadCatalog(c)])) as Catalogs;
const schedule: Schedule = {};
for (const date of dateRange(start, today)) schedule[date] = selectDay(date, catalogs, schedule, SELECTION_SEED).day;

// Caso difícil 1: o poema com o título mais longo do catálogo, três dias antes de hoje.
const longest = catalogs.poem.filter((i) => i.active).sort((a, b) => b.title.length - a.title.length)[0]!;
const longDay = schedule[addDays(today, -3)]!;
longDay.poem = { ...longDay.poem, id: longest.id, title: longest.title, author: longest.author, url: longest.url, source: longest.source };

saveSchedule(schedule, join(DIR, 'schedule.json'));

// Caso difícil 2: o conto de anteontem deixou de estar disponível.
writeJson(join(DIR, 'inactive.json'), [schedule[addDays(today, -2)]!.story.id]);

const NOTES = [
  'Sample note. An original editorial note of two to four sentences will go here, on what the text is about and why it is worth reading.',
  'Sample note, shorter. It shows how the card looks with little text.',
  'Sample note, deliberately long, to test the card on narrow screens. The final note will say what the text is about and why it is worth reading, without quoting from it. It will run to two to four sentences. This one also includes a very long word, antidisestablishmentarianistically, to make sure nothing overflows.',
];
const notes: Record<string, { text: string; reviewed: boolean }> = {};
Object.values(schedule).forEach((day, i) =>
  CATEGORIES.forEach((c, j) => {
    // Alguns textos sem nota, para ver o cartão nesse estado.
    if ((i + j) % 5 === 4) return;
    notes[day[c].id] = { text: NOTES[(i + j) % NOTES.length]!, reviewed: true };
  }),
);
writeJson(join(DIR, 'notes.json'), notes);

console.log(`Dados de exemplo: ${DAYS} dias, de ${start} a ${today}, em data/sample/`);
