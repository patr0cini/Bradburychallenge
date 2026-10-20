import type { CollectResult, Source, SourceContext } from '../lib/types.js';
import curated from './wikisource-essays.json' with { type: 'json' };

// Ensaios clássicos em domínio público na Wikisource (en.wikisource.org).
//
// A lista em wikisource-essays.json é curada: coletâneas canónicas (Montaigne na tradução de
// Cotton, Bacon, Hazlitt, Emerson, Woolf, Wilde, Chesterton, Stevenson, Pater) e ensaios
// isolados (Poe, De Quincey, Thoreau, George Eliot, Twain, Swift, Shelley). Só autores mortos há
// mais de 70 anos, para estarem em domínio público também na UE. Preliminares, índices e
// continuações ficaram de fora.
//
// A recolha só confirma que cada página continua a existir. Usa as páginas /wiki/, que o
// robots.txt permite; a API (/w/api.php) está fechada a robôs genéricos.

export interface CuratedEssay {
  title: string;
  author: string;
  url: string;
  work: string;
  translator?: string;
}

export const CURATED_ESSAYS: CuratedEssay[] = curated;

export const wikisource: Source = {
  id: 'wikisource',
  name: 'Wikisource (ensaios clássicos)',
  siteName: 'Wikisource',
  categories: ['essay'],

  async collect(ctx: SourceContext): Promise<CollectResult> {
    const result: CollectResult = { items: [], excluded: [], complete: true };
    for (const [n, e] of CURATED_ESSAYS.entries()) {
      if (n > 0 && n % 50 === 0) ctx.log(`${n}/${CURATED_ESSAYS.length} páginas confirmadas`);
      try {
        await ctx.fetchText(e.url);
      } catch (err) {
        // Página removida ou renomeada: fica de fora até a lista ser corrigida.
        result.excluded!.push({ url: e.url, reason: `página indisponível: ${err instanceof Error ? err.message : err}` });
        continue;
      }
      result.items.push({
        category: 'essay',
        title: e.title,
        author: e.author,
        url: e.url,
        paywalled: false,
        ...(e.translator ? { translator: e.translator } : {}),
      });
    }
    return result;
  },
};
