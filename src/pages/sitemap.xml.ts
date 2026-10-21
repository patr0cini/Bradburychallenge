import type { APIRoute } from 'astro';
import { loadSiteData } from '../site/data.js';
import { DAYS_PER_PAGE, pastDays } from '../site/paths.js';
import { archivePath, dayPath } from '../site/strings.js';

// sitemap.xml: página inicial, páginas de cada dia publicado, Arquivo e páginas fixas.
export const GET: APIRoute = ({ site }) => {
  const { days } = loadSiteData();
  const abs = (path: string) => new URL(path, site).href;
  const archivePages = Math.max(1, Math.ceil(pastDays().length / DAYS_PER_PAGE));
  const latest = days.at(-1)?.date;
  const urls: { loc: string; lastmod?: string }[] = [
    { loc: abs('/'), lastmod: latest },
    ...Array.from({ length: archivePages }, (_, i) => ({ loc: abs(archivePath(i + 1)), lastmod: i === 0 ? latest : undefined })),
    ...days.map((d) => ({ loc: abs(dayPath(d.date)), lastmod: d.date })),
    ...['/bradbury-challenge/', '/read/', '/write/', '/support/', '/about/', '/privacy/', '/cookies/', '/contact/'].map((p) => ({ loc: abs(p) })),
  ];
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n') +
    '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
