// Recomendações dos separadores Read e Write. Cada item vira uma ligação de afiliado para uma
// pesquisa na Amazon (ver amazonLink em settings.ts). As notas são originais e curtas.

export interface Recommendation {
  title: string;
  /** Autor, organizador ou marca. */
  by?: string;
  note: string;
  /** Texto da pesquisa na Amazon. */
  query: string;
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
        title: 'Zen in the Art of Writing',
        by: 'Ray Bradbury',
        note: 'His essays on writing with joy and speed, and on feeding the imagination by reading widely. The closest thing to a manual for this challenge.',
        query: 'Zen in the Art of Writing Ray Bradbury',
      },
      {
        title: 'The Illustrated Man',
        by: 'Ray Bradbury',
        note: 'Eighteen stories framed by the moving tattoos of a stranger: a good way to see how much a short story can hold.',
        query: 'The Illustrated Man Ray Bradbury',
      },
      {
        title: 'The Martian Chronicles',
        by: 'Ray Bradbury',
        note: 'Linked stories about the settlement of Mars, less about rockets than about loneliness, memory and what people carry with them.',
        query: 'The Martian Chronicles Ray Bradbury',
      },
      {
        title: 'Dandelion Wine',
        by: 'Ray Bradbury',
        note: 'One summer in a small Illinois town in 1928, seen by a twelve-year-old who has just realised he is alive.',
        query: 'Dandelion Wine Ray Bradbury',
      },
      {
        title: 'Fahrenheit 451',
        by: 'Ray Bradbury',
        note: 'A fireman whose job is to burn books starts to read them. Short, urgent, and still uncomfortably current.',
        query: 'Fahrenheit 451 Ray Bradbury',
      },
    ],
  },
  {
    heading: 'Short stories',
    items: [
      {
        title: 'Dubliners',
        by: 'James Joyce',
        note: 'Fifteen stories of ordinary Dublin lives, ending with "The Dead", one of the finest long stories in English.',
        query: 'Dubliners James Joyce',
      },
      {
        title: 'Selected Stories',
        by: 'Anton Chekhov',
        note: 'The writer who showed that a story can end without resolving anything, and still leave you changed.',
        query: 'Anton Chekhov selected stories',
      },
      {
        title: 'A Manual for Cleaning Women',
        by: 'Lucia Berlin',
        note: 'Funny, tough stories drawn from a life of odd jobs and hard places, written with an ear for how people really talk.',
        query: 'A Manual for Cleaning Women Lucia Berlin',
      },
      {
        title: 'Labyrinths',
        by: 'Jorge Luis Borges',
        note: 'Stories and essays about infinite libraries, mirrors and forking paths: ideas that unfold in a few pages.',
        query: 'Labyrinths Jorge Luis Borges',
      },
    ],
  },
  {
    heading: 'Poems',
    items: [
      {
        title: 'The Rattle Bag',
        by: 'edited by Seamus Heaney and Ted Hughes',
        note: 'An anthology arranged alphabetically rather than by period, so ballads, riddles and modern poems sit side by side.',
        query: 'The Rattle Bag Heaney Hughes',
      },
      {
        title: 'Staying Alive',
        by: 'edited by Neil Astley',
        note: 'Five hundred contemporary poems grouped by what they are about, from love to grief to everyday wonder.',
        query: 'Staying Alive real poems for unreal times Neil Astley',
      },
      {
        title: 'Devotions',
        by: 'Mary Oliver',
        note: 'A selection from fifty years of attentive, plain-spoken poems about paying attention.',
        query: 'Devotions Mary Oliver',
      },
    ],
  },
  {
    heading: 'Essays',
    items: [
      {
        title: 'The Complete Essays',
        by: 'Michel de Montaigne (tr. M. A. Screech)',
        note: 'The book that invented the essay: a mind trying itself out on every subject, from friendship to thumbs.',
        query: 'Montaigne The Complete Essays Screech Penguin',
      },
      {
        title: 'The Common Reader',
        by: 'Virginia Woolf',
        note: 'Essays on books and writers by someone who read as a pleasure, not a duty, and made you want to do the same.',
        query: 'The Common Reader Virginia Woolf',
      },
      {
        title: 'Slouching Towards Bethlehem',
        by: 'Joan Didion',
        note: 'California in the 1960s, seen with a cool eye and some of the most precise sentences in American prose.',
        query: 'Slouching Towards Bethlehem Joan Didion',
      },
    ],
  },
];

export const WRITE: RecommendationGroup[] = [
  {
    heading: 'Books on writing',
    items: [
      {
        title: 'On Writing',
        by: 'Stephen King',
        note: 'Half memoir, half toolkit, with very practical advice on drafting, revising and reading a lot.',
        query: 'On Writing Stephen King',
      },
      {
        title: 'Bird by Bird',
        by: 'Anne Lamott',
        note: 'On short assignments, terrible first drafts and getting through the work one small piece at a time.',
        query: 'Bird by Bird Anne Lamott',
      },
      {
        title: 'Steering the Craft',
        by: 'Ursula K. Le Guin',
        note: 'A short course in sentences, point of view and rhythm, with exercises you can do alone or in a group.',
        query: 'Steering the Craft Ursula Le Guin',
      },
      {
        title: 'Becoming a Writer',
        by: 'Dorothea Brande',
        note: 'A 1934 classic on the habits behind writing: writing early in the morning, at a set time, before the critic wakes up.',
        query: 'Becoming a Writer Dorothea Brande',
      },
      {
        title: 'The Elements of Style',
        by: 'William Strunk Jr. and E. B. White',
        note: 'A small book of rules for clear English. Not all of them hold, but it is worth knowing them before breaking them.',
        query: 'The Elements of Style Strunk White',
      },
    ],
  },
  {
    heading: 'Notebooks and pens',
    intro: 'For notes on what you read, and for your own drafts.',
    items: [
      {
        title: 'A5 hardcover notebook',
        by: 'Leuchtturm1917',
        note: 'Numbered pages and a blank index, useful for keeping track of the readings that stayed with you.',
        query: 'Leuchtturm1917 A5 hardcover notebook',
      },
      {
        title: 'Pocket notebooks',
        by: 'Field Notes',
        note: 'Thin enough to carry everywhere, for the lines and ideas that turn up away from the desk.',
        query: 'Field Notes pocket notebook',
      },
      {
        title: 'Safari fountain pen',
        by: 'Lamy',
        note: 'A sturdy, inexpensive fountain pen, and a good first one if you want writing by hand to feel like a ritual.',
        query: 'Lamy Safari fountain pen',
      },
      {
        title: 'Gel pens',
        by: 'Pilot G2',
        note: 'Reliable pens that write smoothly on any paper, for marking up printouts and filling notebooks.',
        query: 'Pilot G2 gel pens',
      },
      {
        title: 'Index cards',
        by: '3 × 5 inches',
        note: 'One idea, scene or quotation per card: easy to shuffle when a story needs a new order.',
        query: '3x5 index cards ruled',
      },
    ],
  },
];
