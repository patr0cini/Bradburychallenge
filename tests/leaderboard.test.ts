import { describe, expect, it } from 'vitest';
import {
  IMPORT_UNTIL,
  SITE_FIRST_DAY,
  addDays,
  applyCheckin,
  importCandidate,
  importedState,
  keepImported,
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
import { loadSiteData } from '../src/site/data.ts';

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

describe('leaderboard: importação da sequência ao entrar', () => {
  const today = '2026-11-30';
  const full = (days: string[]) => Object.fromEntries(days.map((d) => [d, ALL]));

  it('o primeiro dia do site bate certo com os dados publicados', () => {
    expect(loadSiteData().days[0]?.date).toBe(SITE_FIRST_DAY);
  });

  it('o browser envia a sequência até ontem e o último dia completo', () => {
    const marks = full(['2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29', '2026-11-30']);
    expect(importCandidate(marks, today, SITE_FIRST_DAY)).toEqual({ streak: 5, last: '2026-11-29' });
    // Ontem falhado (descanso): o último dia completo é anteontem.
    expect(importCandidate(full(['2026-11-27', '2026-11-28']), today, SITE_FIRST_DAY)).toEqual({ streak: 2, last: '2026-11-28' });
    expect(importCandidate({}, today, SITE_FIRST_DAY)).toBeNull();
  });

  it('aceita uma sequência viva e marca-a como importada', () => {
    expect(importedState({ streak: 5, last: '2026-11-29' }, today)).toEqual({
      streak: 5,
      best: 5,
      last: '2026-11-29',
      rest: null,
      imported: 5,
    });
    expect(importedState({ streak: 2, last: '2026-11-28' }, today)?.rest).toBe('2026-11-29');
  });

  it('nunca mais dias do que os que o site tem', () => {
    expect(importedState({ streak: 999, last: '2026-11-29' }, today)?.streak).toBe(41); // 20 out a 29 nov
  });

  it('recusa sequências acabadas, valores estranhos e depois das duas semanas', () => {
    expect(importedState({ streak: 5, last: '2026-11-20' }, today)).toBeNull();
    expect(importedState({ streak: 2.5, last: '2026-11-29' }, today)).toBeNull();
    expect(importedState({ streak: '9', last: '2026-11-29' }, today)).toBeNull();
    expect(importedState(null, today)).toBeNull();
    const after = addDays(IMPORT_UNTIL, 1);
    expect(importedState({ streak: 5, last: addDays(after, -1) }, after)).toBeNull();
  });

  it('a marca de importada some quando a sequência recomeça', () => {
    const before = { streak: 5, best: 5, last: '2026-11-29', rest: null };
    expect(keepImported(before, applyCheckin(before, '2026-11-30'), 5)).toBe(5);
    expect(keepImported(before, applyCheckin(before, '2026-12-03'), 5)).toBe(0);
  });
});
