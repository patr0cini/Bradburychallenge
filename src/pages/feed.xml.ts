import type { APIRoute } from 'astro';
import { SITE_NAME, SITE_URL } from '../config.js';
import { loadSiteData } from '../site/data.js';
import { dayUrl, digestHtml, digestTitle, escapeHtml } from '../site/digest.js';
import { STRINGS as t } from '../site/strings.js';

/** Quantos dias o feed mostra. */
const FEED_DAYS = 30;

// feed.xml: um item por dia, com as três leituras e as ligações (RSS 2.0).
export const GET: APIRoute = () => {
  const days = loadSiteData().days.slice(-FEED_DAYS).reverse();
  // Hora aproximada da publicação (00:05); serve para ordenar.
  const pubDate = (iso: string) => new Date(`${iso}T00:05:00Z`).toUTCString();
  const items = days
    .map(
      (d) => `    <item>
      <title>${escapeHtml(digestTitle(d))}</title>
      <link>${dayUrl(d.date)}</link>
      <guid isPermaLink="true">${dayUrl(d.date)}</guid>
      <pubDate>${pubDate(d.date)}</pubDate>
      <description>${escapeHtml(digestHtml(d))}</description>
    </item>`,
    )
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeHtml(t.tagline)}</description>
    <language>en-gb</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${days[0] ? `    <lastBuildDate>${pubDate(days[0].date)}</lastBuildDate>\n` : ''}${items}
  </channel>
</rss>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
