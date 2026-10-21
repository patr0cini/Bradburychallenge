// Imagens de partilha (Open Graph, 1200 × 630): uma por dia, com as três leituras, e uma geral.
// O SVG é montado à mão e convertido em PNG com o resvg, com a PT Serif (licença OFL, em assets/fonts).
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { SITE_NAME, SITE_URL } from '../config.js';
import type { Category } from '../lib/types.js';
import type { SiteDay } from './data.js';
import { escapeHtml } from './digest.js';
import { STRINGS as t, formatLongDate } from './strings.js';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const FONT_DIR = join(process.cwd(), 'assets', 'fonts');
const FONT_FILES = ['PT_Serif-Web-Regular.ttf', 'PT_Serif-Web-Bold.ttf'].map((f) => join(FONT_DIR, f));

// As mesmas cores do site (modo claro), em src/styles/global.css.
const C = { bg: '#fbfaf7', text: '#1d1b18', muted: '#5c5750', border: '#e2ddd3' };
const TAG: Record<Category, { bg: string; text: string }> = {
  poem: { bg: '#f6e1e3', text: '#7a1f2b' },
  essay: { bg: '#dfeaf5', text: '#1b4a72' },
  story: { bg: '#e2efdc', text: '#2c5823' },
};

const MARGIN = 80;

/** Largura aproximada de um texto, em unidades de em (o resvg não mede texto a partir do JavaScript). */
function emWidth(s: string, bold = false): number {
  let w = 0;
  for (const ch of s) {
    if (ch === ' ') w += 0.27;
    else if ("ilIjtf.,:;'’!|()[]".includes(ch)) w += 0.32;
    else if ('mwMW'.includes(ch)) w += 0.86;
    else if (ch >= 'A' && ch <= 'Z') w += 0.68;
    else w += 0.53;
  }
  return bold ? w * 1.07 : w;
}

/** Corta o texto, com reticências, para caber em `maxPx` com o tamanho de letra dado. */
function fit(s: string, size: number, maxPx: number, bold = false): string {
  if (emWidth(s, bold) * size <= maxPx) return s;
  const chars = [...s];
  while (chars.length > 1 && emWidth(chars.join('') + '…', bold) * size > maxPx) chars.pop();
  return chars.join('').trimEnd() + '…';
}

const text = (x: number, y: number, size: number, content: string, o: { bold?: boolean; fill?: string; anchor?: string } = {}) =>
  `<text x="${x}" y="${y}" font-family="PT Serif" font-size="${size}"${o.bold ? ' font-weight="700"' : ''} fill="${o.fill ?? C.text}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}>${escapeHtml(content)}</text>`;

function frame(inner: string, tagline = true): string {
  const host = new URL(SITE_URL).host;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <rect width="100%" height="100%" fill="${C.bg}"/>
  <rect x="0" y="0" width="${OG_WIDTH}" height="10" fill="${C.text}"/>
  ${inner}
  <line x1="${MARGIN}" y1="${OG_HEIGHT - 78}" x2="${OG_WIDTH - MARGIN}" y2="${OG_HEIGHT - 78}" stroke="${C.border}" stroke-width="2"/>
  ${text(MARGIN, OG_HEIGHT - 36, 26, host, { fill: C.muted })}
  ${tagline ? text(OG_WIDTH - MARGIN, OG_HEIGHT - 36, 26, 'A poem, an essay and a story, every day', { fill: C.muted, anchor: 'end' }) : ''}
</svg>`;
}

function toPng(svg: string): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: OG_WIDTH },
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'PT Serif' },
  });
  return resvg.render().asPng();
}

export function dayImageSvg(day: SiteDay): string {
  const titleX = MARGIN + 150;
  const maxTitle = OG_WIDTH - MARGIN - titleX;
  const rows = day.readings
    .map((r, i) => {
      const y = 228 + i * 112;
      const tag = TAG[r.category];
      const label = t.category[r.category].toUpperCase();
      const by = `${r.author}${r.translator ? t.translatedBy(r.translator) : ''} · ${r.siteName}`;
      return `<rect x="${MARGIN}" y="${y - 30}" width="128" height="40" rx="20" fill="${tag.bg}"/>
  ${text(MARGIN + 64, y - 1, 20, label, { bold: true, fill: tag.text, anchor: 'middle' })}
  ${text(titleX, y, 40, fit(r.title, 40, maxTitle, true), { bold: true })}
  ${text(titleX, y + 40, 26, fit(by, 26, maxTitle), { fill: C.muted })}`;
    })
    .join('\n  ');
  return frame(`${text(MARGIN, 96, 36, SITE_NAME, { bold: true })}
  ${text(MARGIN, 142, 30, formatLongDate(day.date), { fill: C.muted })}
  ${rows}`);
}

export const dayImage = (day: SiteDay) => toPng(dayImageSvg(day));

export function siteImage(): Buffer {
  return toPng(
    frame(`${text(MARGIN, 250, 76, SITE_NAME, { bold: true })}
  ${text(MARGIN, 330, 38, 'Every day, a poem, an essay and a short story', { fill: C.muted })}
  ${text(MARGIN, 380, 38, "to read, after Ray Bradbury's advice.", { fill: C.muted })}`, false),
  );
}
