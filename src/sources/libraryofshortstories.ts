import type { CollectResult, Source, SourceContext } from '../lib/types.js';

// O site publica o catálogo completo num único JSON (o mesmo que a página "The Library" usa).
const LIST_URL = 'https://www.libraryofshortstories.com/storylist-reduced';
const READER = 'https://www.libraryofshortstories.com/onlinereader/';

interface LossStory {
  title: string;
  author: string;
  code: string;
  words?: number;
  genres?: string[];
  publish_year?: number;
  translators?: string[];
}

/** Géneros que não são contos literários para adultos (fábulas, contos infantis, poemas). */
const EXCLUDED_GENRES = new Set(['childrens', 'poetry']);
const MIN_WORDS = 800;

export function lossExclusionReason(s: LossStory): string | null {
  const genre = s.genres?.find((g) => EXCLUDED_GENRES.has(g));
  if (genre) return `género excluído: ${genre}`;
  if ((s.words ?? 0) < MIN_WORDS) return `demasiado curto (${s.words ?? 0} palavras)`;
  return null;
}

export const libraryOfShortStories: Source = {
  id: 'libraryofshortstories',
  name: 'Library of Short Stories',
  siteName: 'Library of Short Stories',
  categories: ['story'],

  async collect(ctx: SourceContext): Promise<CollectResult> {
    const list = await ctx.fetchJson<LossStory[]>(LIST_URL);
    const result: CollectResult = { items: [], excluded: [], complete: true };
    for (const s of list) {
      const url = READER + s.code;
      const reason = lossExclusionReason(s);
      if (reason) {
        result.excluded!.push({ url, reason });
        continue;
      }
      result.items.push({
        category: 'story',
        title: s.title.trim(),
        author: s.author.trim(),
        url,
        paywalled: false,
        year: s.publish_year,
        translator: s.translators?.join(', ') || undefined,
      });
    }
    return result;
  },
};
