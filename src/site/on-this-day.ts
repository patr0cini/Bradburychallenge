// "On this day": escritores nascidos ou mortos neste dia do ano, com livros grátis no Project
// Gutenberg. Os dados vêm do Wikidata (CC0) e do catálogo do Gutenberg, e são gerados uma vez por
// `npm run on-this-day` para data/on-this-day.json; o site só lê esse ficheiro.
import { join } from 'node:path';
import { DATA_DIR, readJson } from '../lib/catalog.js';

export interface LiteraryEvent {
  event: 'born' | 'died';
  /** Ano do acontecimento. */
  year: number;
  name: string;
  /** Descrição curta do Wikidata, sem as datas entre parênteses. */
  description?: string;
  born?: number;
  died?: number;
  /** Página do autor no Project Gutenberg. */
  gutenberg: string;
  wikipedia?: string;
}

/** Por dia do ano ("11-05"), os acontecimentos mais relevantes primeiro. */
export type OnThisDayFile = Record<string, LiteraryEvent[]>;

export const ON_THIS_DAY_FILE = join(DATA_DIR, 'on-this-day.json');

let cache: OnThisDayFile | undefined;

/** Acontecimentos do dia do ano de uma data ISO ("2026-11-05" → "11-05"). */
export function onThisDay(date: string, data: OnThisDayFile = (cache ??= readJson<OnThisDayFile>(ON_THIS_DAY_FILE, {}))) {
  return data[date.slice(5)] ?? [];
}

/** Lê um CSV (RFC 4180: campos entre aspas podem ter vírgulas, aspas duplicadas e mudanças de linha). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Livros em inglês por autor no catálogo do Gutenberg, agrupados pelas datas de vida ("1885-1981").
 * Cada autor aparece como "Apelido, Nome, 1885-1981", às vezes com um papel ("[Translator]").
 */
export function englishBooksByLifespan(rows: string[][]): Map<string, Map<string, number>> {
  const [header, ...data] = rows;
  const lang = header!.indexOf('Language');
  const authors = header!.indexOf('Authors');
  const type = header!.indexOf('Type');
  const index = new Map<string, Map<string, number>>();
  for (const r of data) {
    if (r[type] !== 'Text' || !(r[lang] ?? '').split('; ').includes('en')) continue;
    for (const raw of (r[authors] ?? '').split('; ')) {
      if (/\[(Translator|Editor|Illustrator|Contributor|Compiler|Commentator)/.test(raw)) continue;
      const m = raw.match(/^(.*?), (\d{3,4})-(\d{3,4})\b/);
      if (!m) continue;
      const key = `${m[2]}-${m[3]}`;
      const byName = index.get(key) ?? new Map<string, number>();
      byName.set(m[1]!, (byName.get(m[1]!) ?? 0) + 1);
      index.set(key, byName);
    }
  }
  return index;
}

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** Livros em inglês de uma pessoa: mesmas datas de vida e o apelido do Gutenberg contido no nome. */
export function englishBookCount(index: Map<string, Map<string, number>>, name: string, born: number, died: number) {
  const byName = index.get(`${born}-${died}`);
  if (!byName) return 0;
  const words = new Set(fold(name).split(/[^\p{L}]+/u));
  let n = 0;
  for (const [author, count] of byName) {
    const surname = fold(author.split(', ')[0]!).split(/[^\p{L}]+/u).filter(Boolean);
    if (surname.length && surname.every((w) => words.has(w))) n += count;
  }
  return n;
}

/** "American journalist (1857-1944)" → "American journalist". */
export const cleanDescription = (d: string) => d.replace(/\s*\([^)]*\d{3,4}[^)]*\)\s*$/, '').trim();

/** Encurta descrições longas do Wikidata pela última vírgula que caiba em `max` caracteres. */
export function shortDescription(d: string, max = 70): string {
  if (d.length <= max) return d;
  const parts = d.split(', ');
  let out = parts[0]!;
  for (const p of parts.slice(1)) {
    if (`${out}, ${p}`.length > max) break;
    out = `${out}, ${p}`;
  }
  return out;
}
