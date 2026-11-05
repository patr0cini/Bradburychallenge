import { describe, expect, it } from 'vitest';
import {
  cleanDescription,
  englishBookCount,
  englishBooksByLifespan,
  onThisDay,
  parseCsv,
  shortDescription,
} from '../src/site/on-this-day.js';

const CATALOG = `Text#,Type,Issued,Title,Language,Authors,Subjects,LoCC,Bookshelves
1,Text,2001-01-01,"The Picture of Dorian Gray",en,"Wilde, Oscar, 1854-1900",Fiction,PR,
2,Text,2001-01-01,"Salomé",fr,"Wilde, Oscar, 1854-1900",Drama,PR,
3,Text,2001-01-01,"De Profundis",en,"Wilde, Oscar, 1854-1900; Ross, Robert, 1869-1918 [Editor]","Letters, ""collected""",PR,
4,Sound,2001-01-01,"Audio",en,"Wilde, Oscar, 1854-1900",,,
5,Text,2001-01-01,"A Translation",en,"Durant, Will, 1885-1981 [Translator]",,,
`;

describe('parseCsv', () => {
  it('lê campos entre aspas com vírgulas, aspas e mudanças de linha', () => {
    expect(parseCsv('a,"b, c","d ""e"""\n"f\ng",h\n')).toEqual([
      ['a', 'b, c', 'd "e"'],
      ['f\ng', 'h'],
    ]);
  });
});

describe('livros em inglês no Gutenberg', () => {
  const index = englishBooksByLifespan(parseCsv(CATALOG));

  it('conta só textos em inglês do próprio autor', () => {
    expect(englishBookCount(index, 'Oscar Wilde', 1854, 1900)).toBe(2);
  });

  it('ignora tradutores, editores e datas de vida diferentes', () => {
    expect(englishBookCount(index, 'Will Durant', 1885, 1981)).toBe(0);
    expect(englishBookCount(index, 'Robert Ross', 1869, 1918)).toBe(0);
    expect(englishBookCount(index, 'Oscar Wilde', 1854, 1901)).toBe(0);
  });

  it('exige o apelido no nome', () => {
    expect(englishBookCount(index, 'Someone Else', 1854, 1900)).toBe(0);
  });
});

describe('descrições', () => {
  it('tira as datas no fim', () => {
    expect(cleanDescription('American journalist (1857-1944)')).toBe('American journalist');
    expect(cleanDescription('Russian writer and playwright (1878–1927)')).toBe('Russian writer and playwright');
  });

  it('encurta pela última vírgula que cabe', () => {
    expect(shortDescription('Irish poet')).toBe('Irish poet');
    expect(
      shortDescription('American lexicographer, textbook pioneer, English-language spelling reformer, writer, editor and author'),
    ).toBe('American lexicographer, textbook pioneer');
  });
});

describe('onThisDay', () => {
  it('procura pelo mês e dia da data', () => {
    const data = { '10-16': [{ event: 'born' as const, year: 1854, name: 'Oscar Wilde', gutenberg: 'g' }] };
    expect(onThisDay('2026-10-16', data)).toHaveLength(1);
    expect(onThisDay('2026-10-17', data)).toEqual([]);
  });

  it('tem escritores para todos os dias do ano no ficheiro gerado', () => {
    for (let m = 1; m <= 12; m++) {
      const days = new Date(Date.UTC(2028, m, 0)).getUTCDate();
      for (let d = 1; d <= days; d++) {
        const iso = `2028-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        expect(onThisDay(iso).length, iso).toBeGreaterThan(0);
      }
    }
  });
});
