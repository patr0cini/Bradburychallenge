import { createHash } from 'node:crypto';
import { PAUSED_SOURCES, REUSE_MIN_DAYS } from '../config.js';
import { addDays, daysBetween } from './dates.js';
import { CATEGORIES, type CatalogItem, type Category } from './types.js';

/** Cópia dos dados do texto no momento da seleção: o dia fica fixo mesmo que o catálogo mude. */
export interface ScheduledReading {
  id: string;
  title: string;
  author: string;
  url: string;
  source: string;
  paywalled: boolean | null;
  translator?: string;
  /** Quantas vezes este texto já tinha sido escolhido antes deste dia (0 = primeira vez). */
  previousUses: number;
}

export interface ScheduleDay {
  poem: ScheduledReading;
  essay: ScheduledReading;
  story: ScheduledReading;
  createdAt: string;
}

/** data/schedule.json: seleção fixa de cada dia, por data ISO. */
export type Schedule = Record<string, ScheduleDay>;

export type Catalogs = Record<Category, CatalogItem[]>;

export interface Selection {
  day: ScheduleDay;
  warnings: string[];
}

/** Número pseudo-aleatório estável a partir de uma chave (primeiros 48 bits de SHA-256). */
export function stableHash(key: string): number {
  return parseInt(createHash('sha256').update(key).digest('hex').slice(0, 12), 16);
}

interface Usage {
  count: number;
  lastUsed: string;
}

function usageByItem(schedule: Schedule, category: Category, before: string): Map<string, Usage> {
  const usage = new Map<string, Usage>();
  for (const date of Object.keys(schedule).sort()) {
    if (date >= before) break;
    const id = schedule[date]![category].id;
    const u = usage.get(id) ?? { count: 0, lastUsed: date };
    usage.set(id, { count: u.count + 1, lastUsed: date });
  }
  return usage;
}

/**
 * Só entram na seleção textos ativos e confirmados como de acesso livre. Os que são só para
 * assinantes, ou cujo acesso não se conseguiu confirmar, ficam no catálogo mas nunca saem.
 * Os textos de fontes em pausa (PAUSED_SOURCES) também não saem enquanto a pausa durar.
 */
export function isSelectable(i: CatalogItem): boolean {
  return i.active && i.paywalled === false && !PAUSED_SOURCES.has(i.source);
}

/**
 * Textos que podem ser escolhidos num dia:
 * 1. os ativos com o menor número de usos (primeiro os nunca usados);
 * 2. quando todos já foram usados, só os que não aparecem há mais de REUSE_MIN_DAYS dias.
 */
export function eligibleItems(items: CatalogItem[], usage: Map<string, Usage>, date: string) {
  const active = items.filter(isSelectable);
  const restsLongEnough = (i: CatalogItem) => {
    const u = usage.get(i.id);
    return !u || daysBetween(u.lastUsed, date) > REUSE_MIN_DAYS;
  };
  const pool = active.filter(restsLongEnough);
  if (pool.length === 0) return { round: 0, candidates: [] as CatalogItem[] };
  const round = Math.min(...pool.map((i) => usage.get(i.id)?.count ?? 0));
  return { round, candidates: pool.filter((i) => (usage.get(i.id)?.count ?? 0) === round) };
}

/**
 * Escolhe a fonte: a que está mais atrasada em relação à quota proporcional ao tamanho do seu
 * catálogo, nunca a de ontem quando há alternativa. Empates resolvidos pela seed.
 */
export function chooseSource(
  candidates: CatalogItem[],
  activeItems: CatalogItem[],
  history: string[],
  yesterdaySource: string | undefined,
  tieKey: string,
): string {
  const available = [...new Set(candidates.map((i) => i.source))];
  const pool = available.length > 1 ? available.filter((s) => s !== yesterdaySource) : available;
  const size = new Map<string, number>();
  for (const i of activeItems) size.set(i.source, (size.get(i.source) ?? 0) + 1);
  const total = activeItems.length;
  const picks = history.length + 1;
  const used = new Map<string, number>();
  for (const s of history) used.set(s, (used.get(s) ?? 0) + 1);
  const deficit = (s: string) => (picks * (size.get(s) ?? 0)) / total - (used.get(s) ?? 0);
  return pool.sort((a, b) => deficit(b) - deficit(a) || stableHash(`${tieKey}|${a}`) - stableHash(`${tieKey}|${b}`))[0]!;
}

function snapshot(item: CatalogItem, previousUses: number): ScheduledReading {
  return {
    id: item.id,
    title: item.title,
    author: item.author,
    url: item.url,
    source: item.source,
    paywalled: item.paywalled,
    ...(item.translator ? { translator: item.translator } : {}),
    previousUses,
  };
}

/** Diz se a categoria já não tem textos por estrear (é altura de tentar atualizar o catálogo). */
export function isExhausted(items: CatalogItem[], schedule: Schedule, category: Category, date: string): boolean {
  const usage = usageByItem(schedule, category, date);
  return !items.some((i) => isSelectable(i) && !usage.has(i.id));
}

/**
 * Seleção de um dia. Função pura: depende só dos catálogos, das seleções anteriores e da seed.
 * Não altera o schedule; quem chama decide gravar.
 */
export function selectDay(date: string, catalogs: Catalogs, schedule: Schedule, seed: string, now = new Date()): Selection {
  const warnings: string[] = [];
  const yesterday = schedule[addDays(date, -1)];
  const picked = {} as Record<Category, ScheduledReading>;

  for (const category of CATEGORIES) {
    const items = catalogs[category];
    const usage = usageByItem(schedule, category, date);
    let { round, candidates } = eligibleItems(items, usage, date);

    if (round > 0 && candidates.length > 0)
      warnings.push(`${category}: catálogo esgotado; novo ciclo (${round + 1}.º), com textos usados há mais de ${REUSE_MIN_DAYS} dias`);
    if (candidates.length === 0) {
      // Catálogo mais pequeno do que o intervalo mínimo: recorre ao texto usado há mais tempo.
      const active = items.filter(isSelectable);
      if (active.length === 0) throw new Error(`${category}: catálogo sem textos ativos e gratuitos`);
      const oldest = Math.min(...active.map((i) => Date.parse(usage.get(i.id)?.lastUsed ?? '1970-01-01')));
      candidates = active.filter((i) => Date.parse(usage.get(i.id)?.lastUsed ?? '1970-01-01') === oldest);
      warnings.push(`${category}: todos os textos foram usados nos últimos ${REUSE_MIN_DAYS} dias; repete o mais antigo`);
    }

    const history = Object.keys(schedule)
      .filter((d) => d < date)
      .sort()
      .map((d) => schedule[d]![category].source);
    const source = chooseSource(
      candidates,
      items.filter(isSelectable),
      history,
      yesterday?.[category].source,
      `${seed}|${category}|${date}`,
    );
    const item = candidates
      .filter((i) => i.source === source)
      .sort((a, b) => stableHash(`${seed}|${category}|${round}|${a.id}`) - stableHash(`${seed}|${category}|${round}|${b.id}`))[0]!;
    picked[category] = snapshot(item, usage.get(item.id)?.count ?? 0);
  }

  return { day: { ...picked, createdAt: now.toISOString() }, warnings };
}
