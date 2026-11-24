import { describe, expect, it } from 'vitest';
import {
  addDays,
  applyCheckin,
  cleanName,
  lisbonDate,
  liveStreak,
  nameKey,
  topStreaks,
  validSecret,
  weekStart,
  type StreakState,
} from '../src/site/leaderboard.ts';
import { readingStats } from '../src/site/stats.ts';

const ALL = ['poem', 'essay', 'story'];

describe('leaderboard: datas', () => {
  it('usa a data de Lisboa', () => {
    expect(lisbonDate(new Date('2026-11-24T23:30:00Z'))).toBe('2026-11-24'); // inverno: Lisboa = UTC
    expect(lisbonDate(new Date('2026-07-01T23:30:00Z'))).toBe('2026-07-02'); // verão: UTC+1
  });

  it('a semana começa à segunda-feira', () => {
    expect(weekStart('2026-11-24')).toBe('2026-11-23'); // terça
    expect(weekStart('2026-11-23')).toBe('2026-11-23'); // segunda
    expect(weekStart('2026-11-29')).toBe('2026-11-23'); // domingo
  });
});

describe('leaderboard: sequência', () => {
  const run = (days: string[]) => days.reduce<StreakState>((s, d) => applyCheckin(s, d), { streak: 0, best: 0 });

  it('dias seguidos somam e repetir o mesmo dia não conta', () => {
    const s = run(['2026-11-20', '2026-11-21', '2026-11-21', '2026-11-22']);
    expect(s.streak).toBe(3);
    expect(applyCheckin(s, '2026-11-21')).toBe(s); // dia passado: ignorado
  });

  it('um dia falhado é descanso; dois seguidos recomeçam', () => {
    expect(run(['2026-11-01', '2026-11-02', '2026-11-04']).streak).toBe(3);
    expect(run(['2026-11-01', '2026-11-02', '2026-11-05']).streak).toBe(1);
  });

  it('só um descanso a cada 7 dias', () => {
    expect(run(['2026-11-01', '2026-11-03', '2026-11-05']).streak).toBe(1);
    expect(run(['2026-11-01', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-11']).streak).toBe(9); // 2 e 10 são descansos (8 dias de distância)
  });

  it('a sequência mostrada apaga-se quando o leitor deixa de aparecer', () => {
    const s = run(['2026-11-20', '2026-11-21']);
    expect(liveStreak(s, '2026-11-22')).toBe(2); // hoje ainda não acabou
    expect(liveStreak(s, '2026-11-23')).toBe(2); // ontem falhado: descanso
    expect(liveStreak(s, '2026-11-24')).toBe(0);
  });

  it('dá o mesmo resultado que as estatísticas do site, em históricos aleatórios', () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    for (let t = 0; t < 300; t++) {
      const first = '2026-01-01';
      const days: string[] = [first];
      for (let d = 1; d < 60; d++) if (rand() < 0.75) days.push(addDays(first, d));
      const today = addDays(first, 60 + Math.floor(rand() * 3));
      const marks = Object.fromEntries(days.map((d) => [d, ALL]));
      const expected = readingStats(marks, today, first, today).streak;
      expect(liveStreak(run(days), today)).toBe(expected);
    }
  });
});

describe('leaderboard: nomes e chaves', () => {
  it('limpa espaços e aceita nomes normais', () => {
    expect(cleanName('  Ana   Lima ')).toBe('Ana Lima');
    expect(cleanName('José O’Neill')).toBe('José O’Neill');
    expect(cleanName('reader_42')).toBe('reader_42');
  });

  it('recusa nomes curtos, longos, ligações e palavras proibidas', () => {
    expect(cleanName('A')).toBeNull();
    expect(cleanName('x'.repeat(25))).toBeNull();
    expect(cleanName('visit www.spam.com')).toBeNull();
    expect(cleanName('<script>')).toBeNull();
    expect(cleanName('Admin')).toBeNull();
    expect(cleanName(42)).toBeNull();
  });

  it('nomes iguais sem acentos nem maiúsculas têm a mesma chave', () => {
    expect(nameKey('Ána  LIMA')).toBe(nameKey('ana lima'));
  });

  it('a chave secreta tem 64 caracteres hexadecimais', () => {
    expect(validSecret('a'.repeat(64))).toBe(true);
    expect(validSecret('A'.repeat(64))).toBe(false);
    expect(validSecret('abc')).toBe(false);
  });
});

describe('leaderboard: tabela das sequências', () => {
  it('mostra só sequências vivas, da maior para a menor', () => {
    const today = '2026-11-24';
    const rows = [
      { name: 'Ana', streak: 5, best: 5, last: '2026-11-24', rest: null },
      { name: 'Rui', streak: 9, best: 9, last: '2026-11-20', rest: null }, // já acabou
      { name: 'Eva', streak: 7, best: 7, last: '2026-11-23', rest: null },
    ];
    expect(topStreaks(rows, today)).toEqual([
      { name: 'Eva', streak: 7 },
      { name: 'Ana', streak: 5 },
    ]);
  });
});
