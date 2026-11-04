import { describe, expect, it } from 'vitest';
import { dayLabel, personalDay } from '../src/site/progress.ts';

describe('contagem pessoal', () => {
  it('o dia de início é o dia 1, mesmo com a mudança de hora', () => {
    expect(personalDay('2026-11-02', '2026-11-02')).toBe(1);
    expect(personalDay('2026-11-02', '2026-11-04')).toBe(3);
    expect(personalDay('2026-03-28', '2026-03-30')).toBe(3);
    expect(personalDay('2026-11-04', '2026-11-02')).toBeLessThan(1);
  });

  it('mostra o objetivo de 1000 dias e continua depois dele', () => {
    expect(dayLabel(3)).toBe('Day 3 of your 1,000');
    expect(dayLabel(1000)).toBe('Day 1,000 of your 1,000');
    expect(dayLabel(1004)).toBe('Day 1,004 of your challenge');
  });
});
