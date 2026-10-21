// Recomendações dos separadores Read e Write. Cada item vira uma ligação de afiliado para a página
// do produto na Amazon (ver amazonLink em settings.ts). As notas são originais e curtas.

export interface Recommendation {
  title: string;
  /** Autor, tradutor ou marca. */
  by?: string;
  note: string;
  /** Código do produto na amazon.com (ASIN, ou ISBN-10 nos livros impressos). */
  asin: string;
}

export interface RecommendationGroup {
  heading: string;
  intro?: string;
  items: Recommendation[];
}

export const READ: RecommendationGroup[] = [
  {
    heading: 'Ray Bradbury',
    intro: 'Where the challenge comes from.',
    items: [
      {
        title: 'Bradbury Stories: 100 of His Most Celebrated Tales',
        by: 'Ray Bradbury',
        note: 'A hundred stories in one volume: a short story a day for more than three months, from the master of the form.',
        asin: '0060544880',
      },
      {
        title: 'Fahrenheit 451',
        by: 'Ray Bradbury',
        note: 'A fireman whose job is to burn books starts to read them. Short, urgent, and still uncomfortably current.',
        asin: '1451673310',
      },
    ],
  },
  {
    heading: 'How to read',
    intro: 'For getting more out of each day’s poem, essay and story.',
    items: [
      {
        title: 'How to Read a Poem',
        by: 'Terry Eagleton',
        note: 'A guide to reading poems closely, paying attention to tone, rhythm, syntax and form as well as meaning.',
        asin: '1405151412',
      },
      {
        title: 'How to Read Literature',
        by: 'Terry Eagleton (Kindle edition)',
        note: 'Openings, character, narrative, interpretation and value: a lively short course in reading attentively.',
        asin: 'B00CKSWPOE',
      },
      {
        title: 'This Is Shakespeare',
        by: 'Emma Smith',
        note: 'One chapter per play, more interested in the open questions the plays leave than in tidy answers.',
        asin: '1984898159',
      },
    ],
  },
  {
    heading: 'Fiction',
    items: [
      {
        title: 'Labyrinths',
        by: 'Jorge Luis Borges (Kindle edition)',
        note: 'Stories, essays and parables about infinite libraries, mirrors and forking paths: ideas that unfold in a few pages.',
        asin: 'B06XPV8F3Z',
      },
      {
        title: 'A God Strolling in the Cool of the Evening',
        by: 'Mário de Carvalho, translated by Gregory Rabassa',
        note: 'A Portuguese novel set in a town of Roman Lusitania, told by a magistrate facing a crisis he cannot control.',
        asin: '0807122351',
      },
    ],
  },
];

export const WRITE: RecommendationGroup[] = [
  {
    heading: 'Notebooks',
    intro: 'For notes on what you read, and for your own drafts.',
    items: [
      {
        title: 'A5 hardcover notebook, dotted',
        by: 'Leuchtturm1917',
        note: 'Numbered pages and a blank index, useful for keeping track of the readings that stayed with you.',
        asin: 'B002TSIMW4',
      },
      {
        title: 'Pitch Black notebooks, 2-pack',
        by: 'Field Notes',
        note: 'Thin ruled notebooks with a paperback cover, light enough to carry everywhere for lines and ideas away from the desk.',
        asin: 'B06ZZX6ZQH',
      },
      {
        title: 'Small pocket notebooks, 64-pack',
        by: 'Oucaru',
        note: 'Plain kraft notebooks in bulk: one per book, per month or per project, or for a class or writing group.',
        asin: 'B0D7KTG3K4',
      },
    ],
  },
  {
    heading: 'Fountain pens',
    intro: 'Writing by hand slows you down in a good way.',
    items: [
      {
        title: 'Safari fountain pen, matte black',
        by: 'Lamy',
        note: 'A sturdy, inexpensive fountain pen with a medium nib and five ink cartridges: a good first one.',
        asin: 'B01G7DXSU2',
      },
      {
        title: 'Safari fountain pen, dark dusk',
        by: 'Lamy',
        note: 'The same reliable pen in a darker colour, with a medium steel nib and a blue cartridge.',
        asin: 'B0DVCDW7FR',
      },
      {
        title: 'Classic Sport fountain pen',
        by: 'Kaweco',
        note: 'Compact enough for a pocket, and full length once the cap is posted on the back.',
        asin: 'B006CQSVIY',
      },
    ],
  },
  {
    heading: 'Ink',
    items: [
      {
        title: 'Z28 converter',
        by: 'Lamy',
        note: 'Lets a Lamy Safari fill from a bottle instead of cartridges.',
        asin: 'B0019W4EIW',
      },
      {
        title: 'T53 bottled ink, Azurite',
        by: 'Lamy',
        note: 'A 30 ml bottle of deep blue ink, for use with the converter.',
        asin: 'B07H8JVL5R',
      },
      {
        title: 'T53 bottled ink, Obsidian',
        by: 'Lamy',
        note: 'A 30 ml bottle of black ink, for use with the converter.',
        asin: 'B07HMMK5V1',
      },
      {
        title: 'Ink cartridges, Pearl Black',
        by: 'Kaweco',
        note: 'Six short standard cartridges, which fit the Kaweco Sport.',
        asin: 'B00AWQ0INQ',
      },
    ],
  },
];
