import { describe, expect, it } from 'vitest';
import { excerptVerdict, parseByline, parsePoemTitle, quotedOnlyTitle, wpTitle } from '../src/sources/lithub.js';
import { lossExclusionReason } from '../src/sources/libraryofshortstories.js';
import { nybooksAuthors, nybooksCategory } from '../src/sources/nybooks.js';
import { NOT_A_POET, parseRpoPoetPage } from '../src/sources/rpo.js';
import { parsePoetryArchivePoetPage } from '../src/sources/poetryarchive.js';
import { parsePoetryInternationalList, poetryInternationalLastPage } from '../src/sources/poetryinternational.js';
import { issueOf, lrbArticleType, parseLrbIssueToc, parseLrbSubjectPage } from '../src/sources/lrb.js';
import { LITERARY_SECTIONS, NOT_AN_ESSAY_TITLE, isCreativePiece, larb, larbIsProseEssay, larbLastPage, parseLarbEssayList } from '../src/sources/larb.js';

describe('Lit Hub', () => {
  it('lê título e autor dos poemas', () => {
    expect(parsePoemTitle('Read “Cruise Control,” a New Poem by Eric Amling')).toEqual({ title: 'Cruise Control', author: 'Eric Amling' });
    expect(parsePoemTitle('“Sensual Songs for Eight-Year-Olds,” a Poem by Patricia Lockwood')).toEqual({
      title: 'Sensual Songs for Eight-Year-Olds',
      author: 'Patricia Lockwood',
    });
    expect(parsePoemTitle('“Ode to a Leaf Blower” by Jill Bialosky')).toEqual({ title: 'Ode to a Leaf Blower', author: 'Jill Bialosky' });
  });

  it('exclui conjuntos de poemas e títulos não reconhecidos', () => {
    expect(parsePoemTitle('Three Poems by Ada Limón')).toBeNull();
    expect(parsePoemTitle('What Three Recent Films Reveal About Poets')).toBeNull();
  });

  it('lê os outros formatos de título usados pelo Lit Hub', () => {
    expect(parsePoemTitle('“Dead Cats Continue to Meow.” A Poem by Nasser Rabah')).toEqual({
      title: 'Dead Cats Continue to Meow',
      author: 'Nasser Rabah',
    });
    expect(parsePoemTitle(wpTitle('“How It Felt” <br> A Poem by Sharon Olds'))).toEqual({ title: 'How It Felt', author: 'Sharon Olds' });
    expect(parsePoemTitle('“Late Capitalism,” a Prose Poem by Alissa Quart')).toEqual({ title: 'Late Capitalism', author: 'Alissa Quart' });
    expect(parsePoemTitle('Words Have Discovered How to Make Love: 3 Poems by Surrealist Masters')).toBeNull();
  });

  it('reconhece títulos só entre aspas', () => {
    expect(quotedOnlyTitle(wpTitle('&#8220;The Round&#8221;'))).toBe('The Round');
    expect(quotedOnlyTitle('Read the Winners of the Insider Prize')).toBeNull();
  });

  it('distingue contos de coletâneas e excertos de romance', () => {
    expect(excerptVerdict("The following is from Mary Gaitskill's story collection Bad Behavior.")).toBe('story');
    expect(excerptVerdict("The following is from Hiroko Oyamada's novel Garden.")).toBe('novel');
    expect(excerptVerdict("The following is from Hiroko Oyamada's Garden.")).toBe('unknown');
  });

  it('lê a byline com tradutor', () => {
    expect(parseByline('By Hiroko Oyamada (trans. Lucy North)')).toEqual({ author: 'Hiroko Oyamada', translator: 'Lucy North' });
    expect(parseByline('By Madeleine Thien')).toEqual({ author: 'Madeleine Thien', translator: undefined });
    expect(parseByline('A Poem by Stanley Kunitz')).toEqual({ author: 'Stanley Kunitz', translator: undefined });
    expect(parseByline('By Yukiko Motoya, trans. Asa Yoneda')).toEqual({ author: 'Yukiko Motoya', translator: 'Asa Yoneda' });
    expect(parseByline('Daily Fiction')).toBeNull();
  });
});

describe('Library of Short Stories', () => {
  it('exclui contos infantis, poemas e textos muito curtos', () => {
    const base = { title: 'X', author: 'Y', code: 'x', words: 3000 };
    expect(lossExclusionReason({ ...base, genres: ['literary'] })).toBeNull();
    expect(lossExclusionReason({ ...base, genres: ['childrens'] })).toMatch(/childrens/);
    expect(lossExclusionReason({ ...base, genres: ['poetry'] })).toMatch(/poetry/);
    expect(lossExclusionReason({ ...base, words: 300, genres: [] })).toMatch(/curto/);
  });
});

describe('NYRB', () => {
  it('distingue poemas, ensaios e recensões', () => {
    expect(nybooksCategory(['article-form-poem'], 'poem')).toBe('poem');
    expect(nybooksCategory(['article-type-essay', 'article-form-feature'], 'essay')).toBe('essay');
    expect(nybooksCategory(['article-type-book-review', 'article-form-review'], 'essay')).toBeNull();
    expect(nybooksCategory(['article-form-review'], 'poem')).toBeNull();
  });

  it('nos poemas, o primeiro nome é o poeta e os restantes são tradutores', () => {
    const a = { parsely: { meta: { author: [{ name: 'Louise Labé' }, { name: 'Richard Sieburth' }] } } };
    expect(nybooksAuthors(a, 'poem')).toEqual({ author: 'Louise Labé', translator: 'Richard Sieburth' });
    expect(nybooksAuthors(a, 'essay')).toEqual({ author: 'Louise Labé & Richard Sieburth', translator: undefined });
  });
});

describe('páginas HTML', () => {
  it('RPO: autor invertido e índice de poemas, sem ligações de navegação', () => {
    const html = `<nav><a href="/content/copyright">Copyright</a></nav>
      <h1 class="title"><span><a href="/poets/bunyan-john">Bunyan, John (1628 - 1688)</a></span></h1>
      <ol class="poet-titles-list"><li><a href="/content/pilgrim">The Pilgrim</a></li>
      <li><a href="/content/upon-apparel">Upon Apparel</a></li></ol>`;
    expect(parseRpoPoetPage(html)).toEqual({
      author: 'John Bunyan',
      poems: [
        { title: 'The Pilgrim', url: 'https://rpo.library.utoronto.ca/content/pilgrim' },
        { title: 'Upon Apparel', url: 'https://rpo.library.utoronto.ca/content/upon-apparel' },
      ],
    });
  });

  it('RPO: ignora páginas de prémios no índice de poetas', () => {
    expect(NOT_A_POET.test('The Griffin Prize for Excellence In Poetry')).toBe(true);
    expect(NOT_A_POET.test('John Bunyan')).toBe(false);
  });

  it('Poetry Archive: poemas do poeta, sem repetições', () => {
    const html = `<h1 class="f-area-title">Paul Farley</h1><div class="poem-list">
      <div class="poem-title"><h3><a href="https://poetryarchive.org/poem/treacle/">Treacle</a></h3></div>
      <div class="poem-title"><h3><a href="https://poetryarchive.org/poem/treacle/">Treacle</a></h3></div></div>`;
    expect(parsePoetryArchivePoetPage(html)).toEqual({
      author: 'Paul Farley',
      poems: [{ title: 'Treacle', url: 'https://poetryarchive.org/poem/treacle/' }],
    });
  });

  it('Poetry International: calcula a última página a partir do total', () => {
    expect(poetryInternationalLastPage('<span>3917 poems</span>')).toBe(164);
    expect(poetryInternationalLastPage('<span>nada</span>')).toBeNull();
  });

  it('Poetry International: corrige títulos em maiúsculas', () => {
    const html = `<div class="pe--poem"><a href="/en/poets-poems/poems/poem/103-30985_A-NOTE">
      <h3 class="introblock-title">A NOTE FOR ARTHUR RUSSELL</h3><div class="introblock-author">Arlo Parks </div></a></div>`;
    expect(parsePoetryInternationalList(html)).toEqual([
      {
        url: 'https://www.poetryinternational.com/en/poets-poems/poems/poem/103-30985_A-NOTE',
        title: 'A Note for Arthur Russell',
        author: 'Arlo Parks',
      },
    ]);
  });
});

describe('LRB', () => {
  it('lê só os blocos da lista de literatura', () => {
    const html = `<nav><a href="/the-paper/v48/n19/geoff-mann/whats-the-truth">Nav</a></nav>
      <div class="block-item"><h2><a href="/the-paper/v48/n19/michael-wood/near-a-dying-star">Reflections on Zola</a></h2></div>
      <div class="block-item"><h3><a href="/the-paper/v01/n01/william-empson/fairy-flight">Fairy Flight</a></h3>
      <a href="/contributors/william-empson">William Empson</a></div>`;
    expect(parseLrbSubjectPage(html)).toEqual([
      'https://www.lrb.co.uk/the-paper/v48/n19/michael-wood/near-a-dying-star',
      'https://www.lrb.co.uk/the-paper/v01/n01/william-empson/fairy-flight',
    ]);
  });

  it('no índice, distingue recensões de ensaios', () => {
    const html = `<a href="/the-paper/v48/n19/susannah-clapp/on-shelagh-delaney" class="toc-item clearfix"><span class="inner">
        <h3> Susannah Clapp </h3><h4>On Shelagh Delaney</h4></span></a>
      <a href="/the-paper/v48/n19/deborah-friedell/in-the-public-closet" class="toc-item clearfix"><span class="inner">
        <h3> Deborah Friedell </h3><h4><div class="article-reviewed-item">American Scoundrel</div></h4></span></a>`;
    expect(parseLrbIssueToc(html)).toEqual([
      { url: 'https://www.lrb.co.uk/the-paper/v48/n19/susannah-clapp/on-shelagh-delaney', author: 'Susannah Clapp', title: 'On Shelagh Delaney', isReview: false },
      { url: 'https://www.lrb.co.uk/the-paper/v48/n19/deborah-friedell/in-the-public-closet', author: 'Deborah Friedell', title: 'American Scoundrel', isReview: true },
    ]);
  });

  it('lê o tipo do texto na página do artigo', () => {
    expect(lrbArticleType('<div class="paperArticle-container article clearfix defaultArticle type--essay readMore">')).toBe('essay');
    expect(lrbArticleType('<div class="paperArticle-container article clearfix defaultArticle type--poems readMore">')).toBe('poems');
    expect(lrbArticleType('<div>sem marca</div>')).toBeNull();
  });

  it('extrai o número a partir do URL', () => {
    expect(issueOf('https://www.lrb.co.uk/the-paper/v09/n20/julian-barnes/diary')).toBe('v09/n20');
  });
});

describe('LARB', () => {
  it('lê título, autores e secções de cada cartão', () => {
    const html = `<div class="card"><div><a href="/article/a/"></a></div>
        <h2 class="t"><a href="/article/fettuccine-and-forgiveness/">Fettuccine and Forgiveness</a></h2>
        <p class="byline"><span><a href="/contributor/erica-heller/">Erica Heller</a></span></p>
        <ul><li><a href="/sections/fiction/">Fiction</a></li><li><a href="/sections/memoir-essay/">Memoir</a></li></ul></div>
      <div class="card"><h2><a href="/article/two/">Two</a></h2>
        <p><a href="/contributor/a/">A</a> <a href="/contributor/b/">B</a></p></div>`;
    expect(parseLarbEssayList(html)).toEqual([
      {
        url: 'https://lareviewofbooks.org/article/fettuccine-and-forgiveness/',
        title: 'Fettuccine and Forgiveness',
        authors: ['Erica Heller'],
        sections: ['fiction', 'memoir-essay'],
      },
      { url: 'https://lareviewofbooks.org/article/two/', title: 'Two', authors: ['A', 'B'], sections: [] },
    ]);
  });

  it('distingue poemas publicados como "Autor’s ‘Título’" de ensaios sobre outros autores', () => {
    expect(isCreativePiece('Aria Aber’s “The Institution”', ['Aria Aber'])).toBe(true);
    expect(isCreativePiece('From aracelis girmay’s “The Dog”', ['aracelis girmay'])).toBe(true);
    expect(isCreativePiece("Kyle Carrero Lopez’s ‘A Few Miles from Prison’", ['Kyle Carrero Lopez'])).toBe(true);
    // Ensaio de outra pessoa sobre um livro: fica.
    expect(isCreativePiece('Rushdie’s Deal with the Devil', ['Kevin Blankinship'])).toBe(false);
    expect(isCreativePiece('“Left to Folly or to Fate”: Gwendolyn Brooks’s and Elizabeth Bishop’s Ballads', ['Brian Brodeur'])).toBe(false);
    expect(NOT_AN_ESSAY_TITLE.test('Koba: An Excerpt from Ronald Grigor Suny’s “Stalin”')).toBe(true);
    expect(NOT_AN_ESSAY_TITLE.test('The Latin Epigram: Brevity, Levity, and Grief')).toBe(false);
    expect(NOT_AN_ESSAY_TITLE.test('A Conversation: Adam Johnson and Krys Lee')).toBe(true);
    expect(NOT_AN_ESSAY_TITLE.test('Rebecca Handler and Vendela Vida in Conversation')).toBe(true);
    expect(NOT_AN_ESSAY_TITLE.test('John Rechy: An Interview')).toBe(true);
    expect(NOT_AN_ESSAY_TITLE.test('Roundtable on “Citizen: An American Lyric,” Part I')).toBe(true);
    // Ensaio sobre a tradução como conversa: fica.
    expect(NOT_AN_ESSAY_TITLE.test('Sharing Speech: On Translation as Conversation')).toBe(false);
  });

  it('lê o número da última página', () => {
    expect(larbLastPage('<a href="/articles/essays/all/?page=2">2</a><a href="/articles/essays/all/?page=297">297</a>')).toBe(297);
    expect(larbLastPage('<p>sem paginação</p>')).toBeNull();
  });

  it('distingue prosa de ensaio de um poema', () => {
    const para = (n: number) => `<p>${'Uma frase longa de ensaio com várias palavras. '.repeat(n)}</p>`;
    const boilerplate = `<p>${'LARB publishes daily without a paywall as part of our mission. '.repeat(5)}</p>`;
    expect(larbIsProseEssay(boilerplate + Array.from({ length: 12 }, () => para(15)).join(''))).toBe(true);
    expect(larbIsProseEssay(boilerplate + '<p>so, ecstasy<br/>the line<br/>breaks</p>'.repeat(10))).toBe(false);
  });

  it('uma página vazia a meio da lista torna a recolha incompleta', async () => {
    const card = (n: number) =>
      `<div><h2><a href="/article/e${n}/">E${n}</a></h2><a href="/contributor/x/">X</a><a href="/sections/poetry/">P</a></div>`;
    const essay = `<p>${'Prosa de ensaio com muitas palavras e frases completas. '.repeat(20)}</p>`.repeat(10);
    const pages: Record<number, string> = {
      1: card(1) + '<a href="/articles/essays/all/?page=3">3</a>',
      2: '<html>erro temporário</html>',
      3: card(3),
    };
    const result = await larb.collect({
      fetchText: async (u) => (u.includes('/article/') ? essay : pages[Number(new URL(u).searchParams.get('page'))] ?? ''),
      fetchJson: async () => ({}) as never,
      log: () => {},
      knownUrls: new Set(),
    });
    expect(result.items.map((i) => i.title)).toEqual(['E1', 'E3']);
    expect(result.complete).toBe(false);
  });

  it('as secções literárias incluem crítica e memória, não política', () => {
    expect(LITERARY_SECTIONS.has('literary-criticism')).toBe(true);
    expect(LITERARY_SECTIONS.has('memoir-essay')).toBe(true);
    expect(LITERARY_SECTIONS.has('politics-economics')).toBe(false);
  });
});

describe('Wikisource (lista curada)', async () => {
  const { CURATED_ESSAYS } = await import('../src/sources/wikisource.js');

  it('tem URLs únicos da Wikisource em inglês e campos preenchidos', () => {
    expect(CURATED_ESSAYS.length).toBeGreaterThan(300);
    expect(new Set(CURATED_ESSAYS.map((e) => e.url)).size).toBe(CURATED_ESSAYS.length);
    for (const e of CURATED_ESSAYS) {
      expect(e.url).toMatch(/^https:\/\/en\.wikisource\.org\/wiki\//);
      expect(e.title.trim()).toBe(e.title);
      expect(e.title.length).toBeGreaterThan(2);
      expect(e.author).toBeTruthy();
    }
  });

  it('não inclui preliminares, índices, capítulos sem título nem continuações', () => {
    const bad = /^(preface|introduction|contents|index|notes|appendix|front matter|chapter [ivxlc\d]+$)|continued/i;
    expect(CURATED_ESSAYS.filter((e) => bad.test(e.title))).toEqual([]);
  });

  it('só autores mortos há mais de 70 anos (domínio público também na UE)', () => {
    // Ano da morte dos autores da lista; um autor novo tem de ser acrescentado aqui.
    const DIED: Record<string, number> = {
      'Michel de Montaigne': 1592, 'Francis Bacon': 1626, 'William Hazlitt': 1830, 'G. K. Chesterton': 1936,
      'Ralph Waldo Emerson': 1882, 'Virginia Woolf': 1941, 'Robert Louis Stevenson': 1894, 'Walter Pater': 1894,
      'Oscar Wilde': 1900, 'Thomas De Quincey': 1859, 'Henry David Thoreau': 1862, 'Edgar Allan Poe': 1849,
      'George Eliot': 1880, 'Mark Twain': 1910, 'Jonathan Swift': 1745, 'Percy Bysshe Shelley': 1822,
      'Charles Cotton': 1687,
    };
    for (const e of CURATED_ESSAYS) {
      for (const person of [e.author, e.translator].filter(Boolean) as string[]) {
        expect(DIED[person], `${person} sem ano de morte registado`).toBeDefined();
        expect(new Date().getFullYear() - DIED[person]!).toBeGreaterThan(70);
      }
    }
  });
});
