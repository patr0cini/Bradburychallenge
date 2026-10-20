import type { Source } from '../lib/types.js';
import { lithub } from './lithub.js';
import { libraryOfShortStories } from './libraryofshortstories.js';
import { rpo } from './rpo.js';
import { poetryArchive } from './poetryarchive.js';
import { poetryInternational } from './poetryinternational.js';
import { nybooks } from './nybooks.js';
// import { lrb } from './lrb.js';
import { larb } from './larb.js';
import { wikisource } from './wikisource.js';
import { manualSources } from './manual.js';

export interface RegisteredSource {
  source: Source;
  /** Dias mínimos entre recolhas. Nunca menos de 7 (especificação, secção 5). */
  refreshDays: number;
}

/** Fontes com recolha automática permitida (ver docs/verificacao-fontes.md). */
export function allSources(): RegisteredSource[] {
  return [
    { source: lithub, refreshDays: 7 },
    { source: libraryOfShortStories, refreshDays: 7 },
    { source: nybooks, refreshDays: 7 },
    { source: poetryInternational, refreshDays: 7 },
    { source: larb, refreshDays: 7 },
    // LRB desligada: 0 de 274 ensaios verificados são de acesso livre (18 de outubro de 2026).
    // { source: lrb, refreshDays: 7 },
    // Antologias e listas que mudam pouco e exigem muitos pedidos: uma vez por mês chega.
    { source: wikisource, refreshDays: 28 },
    { source: rpo, refreshDays: 28 },
    { source: poetryArchive, refreshDays: 28 },
    ...manualSources().map((source) => ({ source, refreshDays: 0 })),
  ];
}
