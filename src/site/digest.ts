// Resumo das leituras de um dia, igual em todo o lado: feed RSS, redes sociais e newsletter.
import { SITE_URL } from '../config.js';
import type { SiteDay } from './data.js';
import { STRINGS as t, dayPath, formatLongDate } from './strings.js';

export const dayUrl = (date: string) => `${SITE_URL}${dayPath(date)}`;

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** "Readings for Wednesday 21 October 2026". */
export const digestTitle = (day: SiteDay) => `Readings for ${formatLongDate(day.date)}`;

/** Lista HTML das três leituras, com ligações (feed e newsletter). */
export function digestHtml(day: SiteDay): string {
  const items = day.readings
    .map((r) => {
      const by = `${r.author}${r.translator ? t.translatedBy(r.translator) : ''}`;
      return `<li><strong>${t.category[r.category]}:</strong> <a href="${escapeHtml(r.url)}">${escapeHtml(r.title)}</a>, by ${escapeHtml(by)} (${escapeHtml(r.siteName)})</li>`;
    })
    .join('');
  return `<ul>${items}</ul><p><a href="${dayUrl(day.date)}">Today's page on ${escapeHtml(new URL(SITE_URL).host)}</a></p>`;
}

const graphemes = (s: string) => [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].length;

function clip(s: string, max: number): string {
  if (graphemes(s) <= max) return s;
  const parts = [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].map((x) => x.segment);
  return parts.slice(0, Math.max(1, max - 1)).join('').trimEnd() + '…';
}

/**
 * Texto curto para redes sociais, com no máximo `limit` caracteres visíveis (300 no Bluesky,
 * 500 no Mastodon). Os títulos são encurtados se for preciso; a ligação vai sempre no fim.
 */
export function socialText(day: SiteDay, limit = 300): string {
  const head = `Today's readings, ${formatLongDate(day.date)}:`;
  const url = dayUrl(day.date);
  const build = (max: number) =>
    [head, '', ...day.readings.map((r) => `${t.category[r.category]}: ${clip(r.title, max)} (${clip(r.author, 40)})`), '', url].join('\n');
  for (let max = 120; max >= 12; max -= 4) {
    const text = build(max);
    if (graphemes(text) <= limit) return text;
  }
  return build(12);
}
