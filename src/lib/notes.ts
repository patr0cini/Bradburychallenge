import { join } from 'node:path';
import { DATA_DIR, readJson, writeJson } from './catalog.js';

// Notas editoriais (secção 8 da especificação), em inglês. Uma nota por texto, pelo id do texto.
// Só as notas com reviewed: true aparecem no site.

export interface NoteEntry {
  text: string;
  reviewed: boolean;
  /** Como foi escrita: rascunho gerado a ler o texto, ou escrita/editada por uma pessoa. */
  origin: 'generated' | 'human';
  updatedAt: string;
  reviewedAt?: string;
}

export type NotesFile = Record<string, NoteEntry>;

export const NOTES_FILE = join(DATA_DIR, 'notes.json');

export function loadNotes(path = NOTES_FILE): NotesFile {
  return readJson<NotesFile>(path, {});
}

export function saveNotes(notes: NotesFile, path = NOTES_FILE) {
  const sorted = Object.fromEntries(Object.keys(notes).sort().map((k) => [k, notes[k]!]));
  writeJson(path, sorted);
}

/**
 * Fontes cujo texto o gerador pode ler. LARB, NYRB e LRB reservam o uso por IA no robots.txt
 * (bloqueiam ClaudeBot, GPTBot, CCBot...): as notas desses textos são escritas por uma pessoa.
 * Fontes de curadoria manual também ficam de fora por omissão.
 */
const TEXT_READABLE_SOURCES = new Set(['wikisource', 'gutenberg', 'libraryofshortstories', 'rpo', 'lithub', 'poetryarchive', 'poetryinternational']);

export function generatorMayReadText(source: string): boolean {
  return TEXT_READABLE_SOURCES.has(source);
}

// Estilo: inglês natural, 2 a 4 frases, sem frases feitas, sem tom moralista, sem emojis, sem citações.
const CLICHES = [
  'delve',
  'tapestry',
  'testament to',
  'must-read',
  'timeless',
  'masterpiece',
  'a journey',
  'in a world',
  'resonates',
  'poignant reminder',
  'thought-provoking',
  'captivating',
  'unforgettable',
  'stands as',
  'serves as a reminder',
  'invites readers',
  'invites us',
  'reminds us',
  'a must',
  'gem',
];

export function sentences(text: string): string[] {
  // Abreviaturas comuns não terminam frases.
  const protectedText = text.replace(/\b(Mr|Mrs|Ms|Dr|St|vs|e\.g|i\.e|Jr|Sr)\./g, '$1§');
  return protectedText
    .split(/(?<=[.?])\s+(?=[A-Z“"‘'(])/)
    .map((s) => s.replace(/§/g, '.').trim())
    .filter(Boolean);
}

/** Problemas de estilo de uma nota; vazio se estiver em ordem. */
export function noteProblems(text: string, sourceText?: string): string[] {
  const problems: string[] = [];
  const t = text.trim();
  const n = sentences(t).length;
  if (n < 2 || n > 4) problems.push(`tem ${n} frases (devem ser 2 a 4)`);
  if (t.length < 120) problems.push('demasiado curta');
  if (t.length > 700) problems.push('demasiado longa');
  if (/\p{Extended_Pictographic}/u.test(t)) problems.push('tem emojis');
  if (t.includes('!')) problems.push('tem pontos de exclamação');
  if (/[*_#`]|\n/.test(t)) problems.push('tem formatação ou quebras de linha');
  const lower = t.toLowerCase();
  for (const c of CLICHES) if (lower.includes(c)) problems.push(`frase feita: "${c}"`);
  for (const q of t.matchAll(/[“"]([^”"]+)[”"]/g))
    if (q[1]!.split(/\s+/).length > 6) problems.push('cita um excerto entre aspas');
  if (sourceText && longestSharedRun(t, sourceText) >= 8) problems.push('repete uma passagem do texto original');
  return [...new Set(problems)];
}

const words = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? [];

/** Maior sequência de palavras seguidas que a nota partilha com o texto original. */
export function longestSharedRun(note: string, source: string): number {
  const a = words(note);
  const b = words(source);
  const index = new Map<string, number[]>();
  b.forEach((w, i) => index.set(w, [...(index.get(w) ?? []), i]));
  let best = 0;
  for (let i = 0; i < a.length; i++)
    for (const j of index.get(a[i]!) ?? []) {
      let k = 0;
      while (i + k < a.length && j + k < b.length && a[i + k] === b[j + k]) k++;
      best = Math.max(best, k);
    }
  return best;
}
