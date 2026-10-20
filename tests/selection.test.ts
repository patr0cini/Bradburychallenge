import { describe, expect, it } from 'vitest';
import { addDays, dateRange, daysBetween, isoDateInLisbon } from '../src/lib/dates.js';
import { selectDay, type Catalogs, type Schedule } from '../src/lib/selection.js';
import type { CatalogItem, Category } from '../src/lib/types.js';

const START = '2026-11-01';
const FIXED_NOW = new Date('2026-11-01T00:05:00Z');

function makeItems(category: Category, sizes: Record<string, number>): CatalogItem[] {
  return Object.entries(sizes).flatMap(([source, n]) =>
    Array.from({ length: n }, (_, i) => ({
      id: `${source}:${category}/${i}`,
      category,
      title: `${source} ${category} ${i}`,
      author: `Autor ${i}`,
      url: `https://${source}.example/${category}/${i}`,
      paywalled: false,
      source,
      firstSeen: '2026-10-01',
      lastSeen: '2026-10-01',
      active: true,
    })),
  );
}

function catalogs(sizes: Record<string, number>): Catalogs {
  return { poem: makeItems('poem', sizes), essay: makeItems('essay', sizes), story: makeItems('story', sizes) };
}

/** Simula a tarefa diária: gera cada dia por ordem, sem tocar nos já gravados. */
function simulate(cats: Catalogs, days: number, schedule: Schedule = {}, seed = 'teste', warnings: string[] = []) {
  for (const date of dateRange(START, addDays(START, days - 1))) {
    if (schedule[date]) continue;
    const sel = selectDay(date, cats, schedule, seed, FIXED_NOW);
    warnings.push(...sel.warnings);
    schedule[date] = sel.day;
  }
  return schedule;
}

const ids = (s: Schedule, c: Category) => Object.keys(s).sort().map((d) => s[d]![c].id);

describe('seleção diária', () => {
  it('tem sempre um poema, um ensaio e um conto', () => {
    const s = simulate(catalogs({ a: 20, b: 20 }), 10);
    for (const day of Object.values(s)) {
      expect(day.poem.id).toMatch(/:poem\//);
      expect(day.essay.id).toMatch(/:essay\//);
      expect(day.story.id).toMatch(/:story\//);
    }
  });

  it('não repete textos enquanto houver textos por usar', () => {
    const s = simulate(catalogs({ a: 200, b: 150, c: 50 }), 400);
    for (const c of ['poem', 'essay', 'story'] as const) expect(new Set(ids(s, c)).size).toBe(400);
  });

  it('é determinística: os mesmos dados e a mesma seed dão a mesma seleção', () => {
    const cats = catalogs({ a: 100, b: 100 });
    expect(simulate(cats, 60)).toEqual(simulate(cats, 60));
  });

  it('a seed muda a ordem', () => {
    const cats = catalogs({ a: 100, b: 100 });
    expect(ids(simulate(cats, 30, {}, 'x'), 'poem')).not.toEqual(ids(simulate(cats, 30, {}, 'y'), 'poem'));
  });

  it('os dias já gravados ficam fixos, mesmo que o catálogo mude', () => {
    const cats = catalogs({ a: 100, b: 100 });
    const schedule = simulate(cats, 30);
    const before = structuredClone(schedule);
    // O catálogo muda: textos novos, um texto escolhido fica inativo, outro muda de título.
    const changed: Catalogs = {
      ...cats,
      poem: [
        ...cats.poem.map((i) =>
          i.id === before[START]!.poem.id ? { ...i, active: false, title: 'Outro título' } : i,
        ),
        ...makeItems('poem', { c: 300 }),
      ],
    };
    simulate(changed, 60, schedule);
    for (const date of Object.keys(before)) expect(schedule[date]).toEqual(before[date]);
    // A cópia guardada no dia mantém o título original.
    expect(schedule[START]!.poem.title).toBe(before[START]!.poem.title);
  });

  it('só escolhe textos confirmados como gratuitos', () => {
    const cats = catalogs({ a: 60, b: 60 });
    // Um terço só para assinantes, um terço com acesso desconhecido.
    cats.essay = cats.essay.map((i, n) => ({ ...i, paywalled: n % 3 === 0 ? true : n % 3 === 1 ? null : false }));
    const s = simulate(cats, 40);
    const free = new Set(cats.essay.filter((i) => i.paywalled === false).map((i) => i.id));
    expect(ids(s, 'essay').every((id) => free.has(id))).toBe(true);
  });

  it('nunca escolhe textos inativos', () => {
    const cats = catalogs({ a: 50, b: 50 });
    cats.story = cats.story.map((i, n) => (n % 2 === 0 ? { ...i, active: false } : i));
    const s = simulate(cats, 50);
    const inactive = new Set(cats.story.filter((i) => !i.active).map((i) => i.id));
    expect(ids(s, 'story').some((id) => inactive.has(id))).toBe(false);
  });

  it('não repete a fonte em dois dias seguidos quando há alternativa', () => {
    // b + c = 130 textos: com alternância, há alternativa durante 260 dias.
    const s = simulate(catalogs({ a: 500, b: 100, c: 30 }), 260);
    const dates = Object.keys(s).sort();
    for (const c of ['poem', 'essay', 'story'] as const)
      for (let i = 1; i < dates.length; i++) {
        const today = s[dates[i]!]![c].source;
        const yesterday = s[dates[i - 1]!]![c].source;
        expect(today, `${c} em ${dates[i]}`).not.toBe(yesterday);
      }
  });

  it('não repetir textos tem prioridade sobre alternar fontes', () => {
    // Esgotadas b e c, só a tem textos por estrear: repete a fonte em vez de repetir textos.
    const s = simulate(catalogs({ a: 500, b: 100, c: 30 }), 300);
    expect(new Set(ids(s, 'poem')).size).toBe(300);
    const last = Object.keys(s).sort().slice(-20);
    expect(last.every((d) => s[d]!.poem.source === 'a')).toBe(true);
  });

  it('distribui as fontes em proporção ao tamanho dos catálogos, até ao limite da alternância', () => {
    // 400/300/300: sem restrição de alternância, 40%/30%/30%.
    const s = simulate(catalogs({ a: 400, b: 300, c: 300 }), 500);
    const count = (src: string) => ids(s, 'poem').filter((id) => id.startsWith(`${src}:`)).length;
    expect(count('a')).toBeGreaterThanOrEqual(190);
    expect(count('a')).toBeLessThanOrEqual(210);
    expect(count('b')).toBeGreaterThanOrEqual(140);
    expect(count('c')).toBeGreaterThanOrEqual(140);
  });

  it('com uma fonte dominante, a alternância limita-a a metade dos dias', () => {
    const s = simulate(catalogs({ a: 900, b: 100 }), 200);
    const a = ids(s, 'essay').filter((id) => id.startsWith('a:')).length;
    expect(a).toBe(100);
  });

  it('quando a categoria se esgota, recomeça o ciclo sem repetir textos dos últimos 365 dias', () => {
    const warnings: string[] = [];
    // 400 textos por categoria: o ciclo esgota-se ao dia 400.
    const s = simulate(catalogs({ a: 250, b: 150 }), 900, {}, 'teste', warnings);
    const dates = Object.keys(s).sort();
    const lastUse = new Map<string, string>();
    for (const date of dates) {
      for (const c of ['poem', 'essay', 'story'] as const) {
        const r = s[date]![c];
        const prev = lastUse.get(r.id);
        if (prev) expect(daysBetween(prev, date), `${r.id} em ${date}`).toBeGreaterThan(365);
        lastUse.set(r.id, date);
      }
    }
    // O primeiro ciclo usa todos os textos uma vez antes de repetir.
    expect(new Set(ids(s, 'poem').slice(0, 400)).size).toBe(400);
    expect(s[dates[400]!]!.poem.previousUses).toBe(1);
    expect(warnings.some((w) => w.includes('novo ciclo'))).toBe(true);
  });

  it('no novo ciclo usa primeiro os textos usados há mais tempo', () => {
    const s = simulate(catalogs({ a: 250, b: 150 }), 800);
    const dates = Object.keys(s).sort();
    const firstCycle = new Map(dates.slice(0, 400).map((d) => [s[d]!.poem.id, d]));
    // Os textos repetidos nos primeiros dias do segundo ciclo vieram do início do primeiro.
    for (const d of dates.slice(400, 420)) {
      const firstUse = firstCycle.get(s[d]!.poem.id)!;
      expect(daysBetween(firstUse, d)).toBeGreaterThan(365);
    }
  });

  it('com um catálogo mais pequeno do que o intervalo de 365 dias, repete o mais antigo e avisa', () => {
    const warnings: string[] = [];
    const s = simulate(catalogs({ a: 5, b: 5 }), 30, {}, 'teste', warnings);
    expect(Object.keys(s)).toHaveLength(30);
    expect(warnings.some((w) => w.includes('últimos 365 dias'))).toBe(true);
  });
});

describe('datas em Lisboa', () => {
  it('muda de dia à meia-noite de Lisboa, com hora de verão e de inverno', () => {
    // Verão (UTC+1): 23:30 UTC já é o dia seguinte em Lisboa.
    expect(isoDateInLisbon(new Date('2026-07-14T23:30:00Z'))).toBe('2026-07-15');
    // Inverno (UTC+0): 23:30 UTC ainda é o mesmo dia.
    expect(isoDateInLisbon(new Date('2026-12-31T23:30:00Z'))).toBe('2026-12-31');
    // Dia da mudança para a hora de inverno (25 de outubro de 2026).
    expect(isoDateInLisbon(new Date('2026-10-24T23:05:00Z'))).toBe('2026-10-25');
  });

  it('aritmética de calendário', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(daysBetween('2026-11-01', '2027-11-01')).toBe(365);
    expect(dateRange('2026-02-27', '2026-03-01')).toEqual(['2026-02-27', '2026-02-28', '2026-03-01']);
  });
});
