import { describe, expect, it } from 'vitest';
import { readingStats, type Marks } from '../src/site/stats.js';

const ALL = ['poem', 'essay', 'story'];
const full = (...dates: string[]): Marks => Object.fromEntries(dates.map((d) => [d, ALL]));
const nov = (d: number) => `2026-11-${String(d).padStart(2, '0')}`;

describe('estatísticas de leitura', () => {
  it('conta leituras por categoria e dias completos', () => {
    const s = readingStats({ [nov(1)]: ALL, [nov(2)]: ['poem', 'story'], [nov(3)]: ['poem', 'poem'] }, nov(3), nov(1), nov(3));
    expect(s.totals).toEqual({ poem: 3, essay: 1, story: 2 });
    expect(s.fullDays).toBe(1);
  });

  it('ignora marcações fora dos dias publicados', () => {
    const s = readingStats({ '2026-10-01': ALL, [nov(9)]: ALL }, nov(5), nov(1), nov(5));
    expect(s.fullDays).toBe(0);
  });

  it('hoje por completar não quebra a sequência', () => {
    expect(readingStats(full(nov(1), nov(2), nov(3)), nov(4), nov(1), nov(4)).streak).toBe(3);
    expect(readingStats(full(nov(1), nov(2), nov(3), nov(4)), nov(4), nov(1), nov(4)).streak).toBe(4);
  });

  it('um dia falhado por semana é descanso; um segundo recomeça a sequência', () => {
    // 1–3 lidos, 4 falhado (descanso), 5–6 lidos: sequência de 5.
    let s = readingStats(full(nov(1), nov(2), nov(3), nov(5), nov(6)), nov(6), nov(1), nov(6));
    expect(s).toMatchObject({ streak: 5, best: 5, resting: true });
    // Outro falhanço a 8, só 4 dias depois do descanso: recomeça.
    s = readingStats(full(nov(1), nov(2), nov(3), nov(5), nov(6), nov(7), nov(9)), nov(9), nov(1), nov(9));
    expect(s).toMatchObject({ streak: 1, best: 6 });
    // Falhanços a 4 e a 11 (7 dias depois): os dois são descanso.
    const days = [1, 2, 3, 5, 6, 7, 8, 9, 10, 12].map(nov);
    s = readingStats(full(...days), nov(12), nov(1), nov(12));
    expect(s.streak).toBe(10);
  });

  it('dois dias seguidos falhados quebram a sequência; sem leituras não há descanso', () => {
    expect(readingStats(full(nov(1), nov(2), nov(5)), nov(5), nov(1), nov(5))).toMatchObject({ streak: 1, best: 2 });
    expect(readingStats({}, nov(5), nov(1), nov(5))).toMatchObject({ streak: 0, best: 0, resting: false });
  });

  it('o último dia publicado pode ser anterior a hoje', () => {
    expect(readingStats(full(nov(1), nov(2)), nov(4), nov(1), nov(2)).streak).toBe(2);
  });
});
