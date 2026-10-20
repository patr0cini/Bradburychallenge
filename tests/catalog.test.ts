import { describe, expect, it } from 'vitest';
import { itemId, mergeIntoCatalog } from '../src/lib/catalog.js';
import { findProblems } from '../src/lib/validate.js';
import { dedupeKey, invertName } from '../src/lib/text.js';
import type { CatalogItem, CollectedItem } from '../src/lib/types.js';

const poem = (title: string, author: string, url: string): CollectedItem => ({ category: 'poem', title, author, url, paywalled: false });

describe('mergeIntoCatalog', () => {
  it('acrescenta textos novos e mantém firstSeen nos conhecidos', () => {
    const first = mergeIntoCatalog([], 'rpo', 'poem', { items: [poem('A', 'X', 'https://rpo.example/a')], complete: true }, '2026-10-01');
    expect(first.stats.added).toBe(1);
    const second = mergeIntoCatalog(
      first.catalog,
      'rpo',
      'poem',
      { items: [poem('A (rev.)', 'X', 'https://rpo.example/a/')], complete: true },
      '2026-10-08',
    );
    expect(second.stats).toMatchObject({ added: 0, updated: 1 });
    expect(second.catalog[0]).toMatchObject({ title: 'A (rev.)', firstSeen: '2026-10-01', lastSeen: '2026-10-08' });
  });

  it('marca como inativos (sem apagar) os textos que a fonte deixou de listar, só em recolhas completas', () => {
    const base = mergeIntoCatalog(
      [],
      'rpo',
      'poem',
      { items: [poem('A', 'X', 'https://rpo.example/a'), poem('B', 'X', 'https://rpo.example/b')], complete: true },
      '2026-10-01',
    ).catalog;
    const partial = mergeIntoCatalog(base, 'rpo', 'poem', { items: [poem('A', 'X', 'https://rpo.example/a')], complete: false }, '2026-10-08');
    expect(partial.stats.deactivated).toBe(0);
    const full = mergeIntoCatalog(base, 'rpo', 'poem', { items: [poem('A', 'X', 'https://rpo.example/a')], complete: true }, '2026-10-08');
    expect(full.stats.deactivated).toBe(1);
    expect(full.catalog).toHaveLength(2);
    expect(full.catalog.find((i) => i.title === 'B')?.active).toBe(false);
  });

  it('não desativa textos quando uma recolha completa deixa de ver muitos de uma vez', () => {
    const many = Array.from({ length: 100 }, (_, n) => poem(`P${n}`, 'X', `https://rpo.example/${n}`));
    const base = mergeIntoCatalog([], 'rpo', 'poem', { items: many, complete: true }, '2026-10-01').catalog;
    // A fonte devolveu só metade (por exemplo, por uma página vazia): suspeito.
    const half = mergeIntoCatalog(base, 'rpo', 'poem', { items: many.slice(0, 50), complete: true }, '2026-10-08');
    expect(half.stats.deactivated).toBe(0);
    expect(half.stats.suspiciousDeactivations).toBe(50);
    expect(half.catalog.every((i) => i.active)).toBe(true);
    // Poucas remoções reais são aplicadas.
    const few = mergeIntoCatalog(base, 'rpo', 'poem', { items: many.slice(0, 95), complete: true }, '2026-10-08');
    expect(few.stats.deactivated).toBe(5);
  });

  it('desativa sempre os textos que a fonte excluiu explicitamente, mesmo muitos de uma vez', () => {
    const many = Array.from({ length: 100 }, (_, n) => poem(`P${n}`, 'X', `https://rpo.example/${n}`));
    const base = mergeIntoCatalog([], 'rpo', 'poem', { items: many, complete: true }, '2026-10-01').catalog;
    const excluded = many.slice(50).map((i) => ({ url: i.url, reason: 'não é um poema' }));
    const r = mergeIntoCatalog(base, 'rpo', 'poem', { items: many.slice(0, 50), excluded, complete: true }, '2026-10-08');
    expect(r.stats.deactivated).toBe(50);
    expect(r.stats.suspiciousDeactivations).toBe(0);
  });

  it('conta como vistos os textos conhecidos que a fonte ainda lista', () => {
    const base = mergeIntoCatalog([], 'pi', 'poem', { items: [poem('A', 'X', 'https://pi.example/a')], complete: true }, '2026-10-01').catalog;
    const next = mergeIntoCatalog(base, 'pi', 'poem', { items: [], stillListed: ['https://pi.example/a'], complete: true }, '2026-10-08');
    expect(next.stats.deactivated).toBe(0);
    expect(next.catalog[0]!.lastSeen).toBe('2026-10-08');
  });

  it('não acrescenta o mesmo poema vindo de outra fonte', () => {
    const base = mergeIntoCatalog([], 'rpo', 'poem', { items: [poem('The Tyger', 'William Blake', 'https://rpo.example/tyger')], complete: true }, '2026-10-01').catalog;
    const other = mergeIntoCatalog(base, 'pa', 'poem', { items: [poem('Tyger', 'William Blake', 'https://pa.example/tyger')], complete: true }, '2026-10-01');
    expect(other.stats.skippedDuplicates).toBe(1);
    expect(other.catalog).toHaveLength(1);
  });

  it('não acrescenta o mesmo poema em dois URLs da mesma fonte', () => {
    const r = mergeIntoCatalog(
      [],
      'pa',
      'poem',
      { items: [poem('Ulysses', 'Alfred Tennyson', 'https://pa.example/ulysses'), poem('Ulysses', 'Alfred Tennyson', 'https://pa.example/ulysses-2')], complete: true },
      '2026-10-01',
    );
    expect(r.stats).toMatchObject({ added: 1, skippedDuplicates: 1 });
  });

  it('ignora itens de outra categoria', () => {
    const r = mergeIntoCatalog([], 'lithub', 'essay', { items: [poem('A', 'X', 'https://l.example/a')], complete: true }, '2026-10-01');
    expect(r.catalog).toHaveLength(0);
  });
});

describe('utilitários', () => {
  it('ids estáveis, sem www, query nem barra final', () => {
    expect(itemId('lithub', 'http://www.lithub.com/crabs/?utm=x')).toBe('lithub:lithub.com/crabs');
  });
  it('inverte nomes "Apelido, Nome (datas)"', () => {
    expect(invertName('Bunyan, John (1628 - 1688)')).toBe('John Bunyan');
    expect(invertName('Anonymous')).toBe('Anonymous');
    expect(invertName('Anonymous,')).toBe('Anonymous');
  });
  it('a chave de duplicados ignora artigos, acentos e pontuação', () => {
    expect(dedupeKey('The Tyger', 'William Blake')).toBe(dedupeKey('Tyger!', 'william blake'));
    expect(dedupeKey('Café', 'José')).toBe(dedupeKey('Cafe', 'Jose'));
  });
});

describe('findProblems', () => {
  it('deteta URLs e duplicados repetidos', () => {
    const item = (id: string, url: string, title = 'A'): CatalogItem => ({
      ...poem(title, 'X', url),
      id,
      source: 's',
      firstSeen: '2026-10-01',
      lastSeen: '2026-10-01',
      active: true,
    });
    const problems = findProblems([item('s:1', 'https://e.example/a'), item('s:2', 'https://e.example/a/'), item('s:3', 'https://e.example/c')]);
    expect(problems.some((p) => p.includes('mesmo URL'))).toBe(true);
    expect(problems.some((p) => p.includes('mesmo título e autor'))).toBe(true);
  });
});
