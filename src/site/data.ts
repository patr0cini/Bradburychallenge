import { join } from 'node:path';
import { DATA_DIR, loadCatalog, readJson } from '../lib/catalog.js';
import { daysBetween, isoDateInLisbon } from '../lib/dates.js';
import { loadSchedule } from '../lib/schedule.js';
import type { ScheduleDay, ScheduledReading } from '../lib/selection.js';
import { CATEGORIES, type Category } from '../lib/types.js';
import { allSources } from '../sources/index.js';

/** Nota editorial de um texto, em inglês (secção 8 da especificação). */
export interface EditorialNote {
  text: string;
  reviewed: boolean;
}

/** data/notes.json: nota de cada texto, pelo id do texto. */
export type NotesFile = Record<string, EditorialNote>;

export interface Reading extends ScheduledReading {
  category: Category;
  siteName: string;
  /** Nota aprovada pelo dono do projeto; as notas por rever não são publicadas. */
  note?: string;
  /** O texto deixou de estar listado na fonte. */
  unavailable: boolean;
}

export interface SiteDay {
  date: string;
  /** "Dia 32 de leituras". */
  number: number;
  readings: Reading[];
}

/**
 * Conjunto de dados: "live" (data/schedule.json) ou "sample" (data/sample/, gerado por
 * `npm run sample`, para desenvolver a interface antes da data de lançamento).
 */
const DATA_SET = process.env.BRADBURY_DATA_SET === 'sample' ? 'sample' : 'live';
const dir = DATA_SET === 'sample' ? join(DATA_DIR, 'sample') : DATA_DIR;

let cache: { days: SiteDay[]; today: string } | undefined;

/** Dias publicados (até hoje, em Lisboa), do mais antigo para o mais recente. */
export function loadSiteData() {
  if (cache) return cache;
  const today = process.env.BRADBURY_TODAY || isoDateInLisbon();
  const schedule = loadSchedule(join(dir, 'schedule.json'));
  const notes = readJson<NotesFile>(join(dir, 'notes.json'), {});
  const inactive = new Set<string>(
    DATA_SET === 'sample'
      ? readJson<string[]>(join(dir, 'inactive.json'), [])
      : CATEGORIES.flatMap((c) => loadCatalog(c).filter((i) => !i.active).map((i) => i.id)),
  );
  const siteNames = new Map(allSources().map(({ source }) => [source.id, source.siteName]));

  const dates = Object.keys(schedule)
    .filter((d) => d <= today)
    .sort();
  const first = dates[0];
  const days: SiteDay[] = dates.map((date) => {
    const day: ScheduleDay = schedule[date]!;
    return {
      date,
      number: daysBetween(first!, date) + 1,
      readings: CATEGORIES.map((category) => {
        const r = day[category];
        const note = notes[r.id];
        return {
          ...r,
          category,
          siteName: siteNames.get(r.source) ?? r.source,
          note: note?.reviewed && note.text ? note.text : undefined,
          unavailable: inactive.has(r.id),
        };
      }),
    };
  });
  cache = { days, today };
  return cache;
}
