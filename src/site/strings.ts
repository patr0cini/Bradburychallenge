import { TIME_ZONE } from '../config.js';
import type { Category } from '../lib/types.js';

// Textos da interface. O site é só em inglês (decisão do dono do projeto, 20 de outubro de 2026).

export const HTML_LANG = 'en-GB';
const LOCALE = 'en-GB';

export const STRINGS = {
  tagline: 'Every day, a poem, an essay and a short story to read.',
  homeDescription: "Today's readings: a poem, an essay and a short story.",
  archiveDescription: 'Readings from previous days.',
  skip: 'Skip to content',
  sections: 'Sections',
  today: 'Today',
  archive: 'Archive',
  category: { poem: 'Poem', essay: 'Essay', story: 'Story' } satisfies Record<Category, string>,
  dayNumber: (n: number) => `Day ${n} of readings`,
  readingsOfDay: "The day's readings",
  shareToday: "Share today's readings",
  shareDay: 'Share these readings',
  opensNewTab: ' (opens in a new tab)',
  translatedBy: (t: string) => `, trans. ${t}`,
  unavailable: 'This text is no longer listed by its source. The link may no longer work.',
  read: 'Read',
  readPartial: (n: number) => `Partly read (${n} of 3)`,
  yesterdayLink: "Yesterday's readings",
  staleYesterday: "These are yesterday's readings. Today's will be available shortly.",
  staleOlder: (date: string) => `These are the most recent readings, from ${date}.`,
  notStartedTitle: 'The readings begin soon',
  notStarted: (date: string) => `The first day of readings is ${date}.`,
  otherDays: 'Other days',
  previousDay: '← Previous day',
  nextDay: 'Next day →',
  dayDescription: (date: string, list: string) => `Readings for ${date}: ${list}.`,
  byAuthor: (title: string, author: string) => `${title} by ${author}`,
  archivePage: (n: number) => `Archive, page ${n}`,
  noPastDays: 'There are no previous days yet.',
  archivePages: 'Archive pages',
  newer: '← Newer',
  more: 'More →',
} as const;

// As datas ISO são dias de calendário; meio-dia UTC fica no mesmo dia em Lisboa todo o ano.
const atNoon = (iso: string) => new Date(`${iso}T12:00:00Z`);
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...o }).format(atNoon(iso));

/** "Saturday 17 October 2026". */
export const formatLongDate = (iso: string) => fmt(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** "Saturday 17 October" (no Arquivo, o ano está no título do mês). */
export const formatDayMonth = (iso: string) => fmt(iso, { weekday: 'long', day: 'numeric', month: 'long' });

/** "October 2026". */
export const formatMonthYear = (iso: string) => fmt(iso, { month: 'long', year: 'numeric' });

export const HOME_PATH = '/';
export const archivePath = (page = 1) => `/archive/${page > 1 ? `${page}/` : ''}`;

/** /2026/10/17/ */
export function dayPath(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `/${y}/${m}/${d}/`;
}
