// Estatísticas de leitura a partir das marcações "Read" (só no browser): totais por categoria,
// dias completos e sequência de dias seguidos.
//
// Sequência: um dia conta quando as três leituras desse dia estão marcadas. Falhar um dia por
// semana não a quebra (é um dia de descanso); um segundo dia falhado em menos de 7 dias recomeça-a.
// O dia de hoje, se ainda não estiver completo, não conta nem quebra: ainda há tempo.
import type { Category } from '../lib/types.js';

export type Marks = Record<string, string[]>;

export interface ReadingStats {
  totals: Record<Category, number>;
  /** Dias com as três leituras marcadas. */
  fullDays: number;
  streak: number;
  best: number;
  /** A sequência atual está a usar um dia de descanso nos últimos 7 dias. */
  resting: boolean;
}

/** Dias entre um falhanço "de descanso" e o seguinte para a sequência se manter. */
export const REST_EVERY = 7;

const noon = (iso: string) => Date.parse(`${iso}T12:00:00Z`);
const DAY = 86_400_000;
const addDays = (iso: string, n: number) => new Date(noon(iso) + n * DAY).toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((noon(b) - noon(a)) / DAY);

/**
 * `firstDay` e `lastDay`: primeiro e último dia publicados no site. Os dias contam até ao mais
 * antigo de `lastDay` e `today`.
 */
export function readingStats(marks: Marks, today: string, firstDay: string, lastDay: string): ReadingStats {
  const end = lastDay < today ? lastDay : today;
  const totals: Record<Category, number> = { poem: 0, essay: 0, story: 0 };
  let fullDays = 0;
  for (const [date, cats] of Object.entries(marks)) {
    if (date < firstDay || date > end) continue;
    for (const c of new Set(cats)) if (c in totals) totals[c as Category]++;
    if (new Set(cats).size >= 3) fullDays++;
  }

  let streak = 0;
  let best = 0;
  let lastRest: string | undefined;
  for (let d = firstDay; d <= end; d = addDays(d, 1)) {
    if (new Set(marks[d] ?? []).size >= 3) {
      streak++;
      best = Math.max(best, streak);
    } else if (d === today) {
      // Hoje ainda não acabou.
    } else if (streak > 0 && (!lastRest || daysBetween(lastRest, d) >= REST_EVERY)) {
      lastRest = d;
    } else {
      streak = 0;
      lastRest = undefined;
    }
  }
  const resting = !!lastRest && daysBetween(lastRest, end) < REST_EVERY;
  return { totals, fullDays, streak, best, resting };
}

export const plural = (n: number, word: string) => `${n.toLocaleString('en-GB')} ${word}${n === 1 ? '' : 's'}`;
