// Leaderboard (opt-in): regras partilhadas pelo browser e pelas Cloudflare Pages Functions.
// Sem DOM e sem Node: só funções puras, testadas em tests/leaderboard.test.ts.
//
// Contagem: um dia conta quando o leitor marca as três leituras desse dia, NO PRÓPRIO DIA (o servidor usa a
// sua data de Lisboa, não a do browser). Assim ninguém preenche dias passados. A sequência segue a regra do
// site (src/site/stats.ts): falhar um dia por semana não a quebra; um segundo dia falhado em menos de 7
// dias recomeça-a. Só conta a partir do dia em que o leitor entra na leaderboard.

const DAY = 86_400_000;
const noon = (iso: string) => Date.parse(`${iso}T12:00:00Z`);
export const addDays = (iso: string, n: number) => new Date(noon(iso) + n * DAY).toISOString().slice(0, 10);
export const daysBetween = (a: string, b: string) => Math.round((noon(b) - noon(a)) / DAY);

/** Dias entre dois dias de descanso para a sequência se manter (igual a stats.ts). */
export const REST_EVERY = 7;

/** Quantos leitores aparecem em cada tabela. */
export const TOP = 10;

/** Data de hoje em Lisboa, AAAA-MM-DD. */
export function lisbonDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** Segunda-feira da semana do dia dado. */
export function weekStart(iso: string): string {
  const dow = new Date(noon(iso)).getUTCDay(); // 0 = domingo
  return addDays(iso, -((dow + 6) % 7));
}

export interface StreakState {
  streak: number;
  best: number;
  /** Último dia completo registado. */
  last?: string | null;
  /** Último dia falhado que contou como descanso. */
  rest?: string | null;
}

/** Pode o dia `missed` contar como descanso? */
const canRest = (rest: string | null | undefined, missed: string) => !rest || daysBetween(rest, missed) >= REST_EVERY;

/** Novo estado depois de o leitor completar `today`. Repetir o mesmo dia não muda nada. */
export function applyCheckin(state: StreakState, today: string): StreakState {
  const { last } = state;
  if (last && today <= last) return state;
  let streak = 1;
  let rest = state.rest ?? null;
  if (last) {
    const gap = daysBetween(last, today);
    if (gap === 1) streak = state.streak + 1;
    else if (gap === 2 && state.streak > 0 && canRest(rest, addDays(last, 1))) {
      rest = addDays(last, 1);
      streak = state.streak + 1;
    } else rest = null;
  }
  return { streak, best: Math.max(state.best, streak), last: today, rest };
}

/** Sequência que se mostra hoje: deixa de contar se o leitor já falhou mais do que o descanso permite. */
export function liveStreak(state: StreakState, today: string): number {
  if (!state.last || state.streak <= 0) return 0;
  const gap = daysBetween(state.last, today);
  if (gap <= 1) return state.streak; // hoje ainda não acabou
  if (gap === 2 && canRest(state.rest, addDays(state.last, 1))) return state.streak;
  return 0;
}

// Nomes: o leitor escolhe; mostram-se em público. Regras simples e uma lista curta de palavras proibidas.
// A moderação manual (esconder um nome) faz-se na base de dados: ver docs/leaderboard.md.
export const NAME_MIN = 2;
export const NAME_MAX = 24;
const NAME_CHARS = /^[\p{L}\p{N}][\p{L}\p{N} .'’_-]*$/u;
const BLOCKED = ['fuck', 'shit', 'cunt', 'nigg', 'fag', 'whore', 'slut', 'bitch', 'rape', 'nazi', 'hitler', 'porn', 'sex', 'admin', 'moderator', 'bradbury challenge'];

/** "  Ana   Lima " → "Ana Lima"; `null` se o nome não for aceite. */
export function cleanName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const name = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (name.length < NAME_MIN || name.length > NAME_MAX || !NAME_CHARS.test(name)) return null;
  const key = nameKey(name);
  if (/https?|www|\.(com|org|net|io)\b/.test(key) || BLOCKED.some((w) => key.replace(/[^a-z0-9 ]/g, '').includes(w))) return null;
  return name;
}

/** Chave para nomes únicos, sem maiúsculas nem acentos: "Ána  LIMA" e "ana lima" são o mesmo nome. */
export function nameKey(name: string): string {
  return name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** A chave secreta do leitor: 32 bytes aleatórios em hexadecimal, gerados no browser. */
export const SECRET_RE = /^[0-9a-f]{64}$/;
export const validSecret = (s: unknown): s is string => typeof s === 'string' && SECRET_RE.test(s);

export interface WeekRow {
  name: string;
  days: number;
}

export interface StreakRow {
  name: string;
  streak: number;
}

export interface Board {
  today: string;
  weekStart: string;
  week: WeekRow[];
  streaks: StreakRow[];
}

/** As maiores sequências ainda vivas hoje, a partir das linhas guardadas. */
export function topStreaks(rows: Array<{ name: string } & StreakState>, today: string, top = TOP): StreakRow[] {
  return rows
    .map((r) => ({ name: r.name, streak: liveStreak(r, today) }))
    .filter((r) => r.streak > 0)
    .sort((a, b) => b.streak - a.streak || a.name.localeCompare(b.name))
    .slice(0, top);
}
