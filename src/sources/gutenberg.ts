import type { CollectResult, Source, SourceContext } from '../lib/types.js';
import curated from './gutenberg-essays.json' with { type: 'json' };

// Ensaios clássicos em domínio público no Project Gutenberg (sugestão de um leitor, novembro de
// 2026, para variar os autores dos ensaios clássicos).
//
// A lista em gutenberg-essays.json é curada: coletâneas de ensaístas mortos há mais de 70 anos
// (Lamb, Thoreau, Addison, De Quincey, Meynell, William James, Repplier, Alexander Smith,
// Goldsmith, Arnold, Twain, Butler, Belloc, Irving, Douglass, Fuller, Jefferies, Jerome, Benson,
// Lynd, Burroughs). Contos, prefácios, índices e notas ficaram de fora. Cada ensaio liga
// para a sua âncora na página HTML do livro; onde o livro não tem âncoras, a ligação usa um
// fragmento de texto (#:~:text=título,-primeiras palavras), que os browsers atuais seguem.
//
// O Gutenberg pede que os robôs não percorram www.gutenberg.org. A recolha só confirma, uma vez
// por livro, que o ficheiro continua a existir e a ter as âncoras, e fá-lo num espelho oficial
// (gutenberg.pglaf.org), que tem os mesmos ficheiros.

export interface GutenbergEssay {
  title: string;
  author: string;
  url: string;
  work: string;
}

export const GUTENBERG_ESSAYS: GutenbergEssay[] = curated;

const MIRROR = 'https://gutenberg.pglaf.org';

/** "https://www.gutenberg.org/cache/epub/849/pg849-images.html#x" → o mesmo ficheiro no espelho. */
export const mirrorUrl = (url: string) => `${MIRROR}${new URL(url).pathname}`;

/** A âncora de um URL (sem "#"), ou undefined se não tiver ou se for um fragmento de texto. */
export function anchorOf(url: string): string | undefined {
  const hash = new URL(url).hash.slice(1);
  return hash && !hash.startsWith(':~:') ? decodeURIComponent(hash) : undefined;
}

export const gutenberg: Source = {
  id: 'gutenberg',
  name: 'Project Gutenberg (ensaios clássicos)',
  siteName: 'Project Gutenberg',
  categories: ['essay'],

  async collect(ctx: SourceContext): Promise<CollectResult> {
    const result: CollectResult = { items: [], excluded: [], complete: true };
    const books = new Map<string, Promise<string>>();
    for (const e of GUTENBERG_ESSAYS) {
      const book = mirrorUrl(e.url);
      if (!books.has(book)) {
        ctx.log(`livro ${books.size + 1}: ${e.work}`);
        books.set(
          book,
          ctx.fetchText(book).catch((err) => {
            throw new Error(`livro indisponível: ${err instanceof Error ? err.message : err}`);
          }),
        );
      }
      try {
        const html = await books.get(book)!;
        const anchor = anchorOf(e.url);
        if (anchor && !html.includes(`id="${anchor}"`)) throw new Error(`âncora #${anchor} desapareceu`);
      } catch (err) {
        result.excluded!.push({ url: e.url, reason: err instanceof Error ? err.message : String(err) });
        continue;
      }
      result.items.push({ category: 'essay', title: e.title, author: e.author, url: e.url, paywalled: false });
    }
    return result;
  },
};
