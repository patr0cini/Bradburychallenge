import { describe, expect, it } from 'vitest';
import { generatorMayReadText, longestSharedRun, noteProblems, sentences } from '../src/lib/notes.js';
const GOOD =
  'Montaigne starts from the grief of a defeated king and asks why the greatest sorrows often leave people silent. ' +
  'He distrusts sorrow as a virtue and watches how it works on the body and the mind. ' +
  'It is a short chapter, and a good first taste of his habit of thinking on the page.';
describe('estilo das notas', () => {
  it('aceita uma nota de 2 a 4 frases sem frases feitas', () => {
    expect(noteProblems(GOOD)).toEqual([]);
  });
  it('conta frases sem partir em abreviaturas', () => {
    expect(sentences('Mr. Brill is not here. Dr. Watson is.')).toHaveLength(2);
  });
  it('rejeita frases a mais, emojis, exclamações, frases feitas e citações', () => {
    expect(noteProblems('One sentence only, and rather short for a note.')).toEqual(
      expect.arrayContaining(['tem 1 frases (devem ser 2 a 4)', 'demasiado curta']),
    );
    expect(noteProblems(`${GOOD} A timeless masterpiece!`).join(' ')).toMatch(/frases feitas|frase feita/);
    expect(noteProblems(`${GOOD.slice(0, -1)} 📚.`)).toContain('tem emojis');
    expect(noteProblems(`He writes that “the greatest sorrows often leave people silent and still”. ${GOOD}`)).toContain(
      'cita um excerto entre aspas',
    );
  });
  it('deteta passagens copiadas do texto original', () => {
    const source = 'Of all the passions, fear is that which most deprives us of judgement and makes us act without reason at all.';
    const copied = 'He notes that fear is that which most deprives us of judgement and makes us act. It is a brief chapter on panic.';
    expect(longestSharedRun(copied, source)).toBeGreaterThanOrEqual(8);
    expect(noteProblems(copied, source)).toContain('repete uma passagem do texto original');
  });
});
describe('política por fonte', () => {
  it('não lê textos de fontes que reservam o uso por IA', () => {
    expect(generatorMayReadText('larb')).toBe(false);
    expect(generatorMayReadText('nybooks')).toBe(false);
    expect(generatorMayReadText('newyorker')).toBe(false); // curadoria manual
    expect(generatorMayReadText('wikisource')).toBe(true);
    expect(generatorMayReadText('lithub')).toBe(true);
  });
});
