import { load } from 'cheerio';

/** Converte um fragmento HTML (por exemplo, um título da API do WordPress) em texto simples. */
export function htmlToText(fragment: string): string {
  return load(`<div>${fragment}</div>`)('div').first().text().replace(/\s+/g, ' ').trim();
}

/** Retira aspas exteriores de um título: “Crabs” → Crabs. */
export function stripOuterQuotes(title: string): string {
  return title.replace(/^[\s"“”‘’']+|[\s"“”‘’',]+$/g, '').trim();
}

/** Títulos em maiúsculas (comuns na Poetry International) passam a capitalização de título. */
export function fixAllCaps(title: string): string {
  if (!/[a-z]/.test(title) && /[A-Z]{2,}/.test(title)) {
    const small = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);
    return title
      .toLowerCase()
      .split(/(\s+)/)
      .map((w, i) => (i > 0 && small.has(w) ? w : w.replace(/^(\p{L})/u, (c) => c.toUpperCase())))
      .join('');
  }
  return title;
}

/** "Bunyan, John (1628 - 1688)" → "John Bunyan". */
export function invertName(name: string): string {
  const clean = name.replace(/\s*\([^)]*\)\s*$/, '').trim().replace(/,$/, '');
  const m = clean.match(/^([^,]+),\s*(.+)$/);
  return m ? `${m[2]} ${m[1]}`.trim() : clean;
}

/** Chave para detetar o mesmo texto em fontes diferentes. */
export function dedupeKey(title: string, author: string): string {
  const norm = (s: string) =>
    s
      .normalize('NFKD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/^(the|a|an)\s+/, '')
      .replace(/[^a-z0-9]+/g, '');
  return `${norm(title)}|${norm(author)}`;
}

/**
 * Sites em que o fragmento distingue textos: no Project Gutenberg um livro é uma só página e cada
 * ensaio é uma âncora dela (#chap03, ou um fragmento de texto #:~:text=…).
 */
const FRAGMENT_HOSTS = new Set(['www.gutenberg.org']);

/** URL canónico: https, sem query string nem fragmento (exceto em FRAGMENT_HOSTS), sem barra final. */
export function canonicalUrl(url: string): string {
  const u = new URL(url);
  u.protocol = 'https:';
  if (!FRAGMENT_HOSTS.has(u.hostname)) u.hash = '';
  u.search = '';
  return u.toString().replace(/\/$/, '');
}
