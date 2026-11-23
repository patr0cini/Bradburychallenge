// Desenhos para produtos (tote bag, caneca, cartazes) em PNG de alta resolução, em merch/out/.
//   npm run merch
// Usam só texto nosso e citações em domínio público: nada de nome, citações ou assinatura de Bradbury
// (ver merch/README.md). Fonte: PT Serif (licença OFL, em assets/fonts), que se pode usar em produtos.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const OUT = join(process.cwd(), 'merch', 'out');
const FONTS = ['PT_Serif-Web-Regular.ttf', 'PT_Serif-Web-Bold.ttf'].map((f) => join(process.cwd(), 'assets', 'fonts', f));
const INK = '#1d1b18';
const PAPER = '#fbfaf7';
const MUTED = '#5c5750';
const ACCENT = '#b3121f';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface TextOptions {
  size: number;
  fill?: string;
  bold?: boolean;
  anchor?: 'start' | 'middle' | 'end';
  spacing?: number;
}

const text = (x: number, y: number, content: string, o: TextOptions) =>
  `<text x="${x}" y="${y}" font-family="PT Serif" font-size="${o.size}"${o.bold ? ' font-weight="700"' : ''} fill="${o.fill ?? INK}" text-anchor="${o.anchor ?? 'start'}"${o.spacing ? ` letter-spacing="${o.spacing}"` : ''}>${esc(content)}</text>`;

/** Largura aproximada de um texto, em unidades de em (o resvg não mede texto a partir do JavaScript). */
function emWidth(s: string, bold = false): number {
  let w = 0;
  for (const ch of s) {
    if (ch === ' ') w += 0.27;
    else if ("ilIjtf.,:;'’!|()[]·".includes(ch)) w += 0.32;
    else if ('mwMW'.includes(ch)) w += 0.86;
    else if (ch >= 'A' && ch <= 'Z') w += 0.68;
    else w += 0.53;
  }
  return bold ? w * 1.07 : w;
}

function render(name: string, width: number, height: number, body: string, background?: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${
    background ? `<rect width="100%" height="100%" fill="${background}"/>` : ''
  }${body}</svg>`;
  const png = new Resvg(svg, { font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'PT Serif' } }).render().asPng();
  writeFileSync(join(OUT, `${name}.png`), png);
  console.log(`${name}.png  ${width}×${height}  ${(png.length / 1e6).toFixed(1)} MB`);
}

mkdirSync(OUT, { recursive: true });

// --- 1. Tote bag: fundo transparente, em tinta escura (para tecido claro) e em branco (para tecido escuro) ---
function tote(ink: string, name: string) {
  const W = 4500;
  const H = 5400;
  const lines = ['One poem.', 'One essay.', 'One story.'];
  let body = '';
  lines.forEach((l, i) => (body += text(W / 2, 1700 + i * 520, l, { size: 430, fill: ink, bold: i === 0 || i === 2 ? false : false, anchor: 'middle' })));
  body += `<line x1="${W / 2 - 700}" y1="3500" x2="${W / 2 + 700}" y2="3500" stroke="${ink}" stroke-width="14"/>`;
  body += text(W / 2, 4000, 'EVERY DAY.', { size: 300, fill: ink, bold: true, anchor: 'middle', spacing: 60 });
  render(name, W, H, body);
}
tote(INK, 'tote-bag-dark-ink');
tote('#ffffff', 'tote-bag-white-ink');

// --- 2. Caneca (11 oz, volta inteira): citação de Francis Bacon, "Of Studies" (1625), em domínio público ---
{
  const W = 2820;
  const H = 1080;
  let body = '';
  const q = ['Reading maketh a full man;', 'conference a ready man;', 'and writing an exact man.'];
  q.forEach((l, i) => (body += text(W / 2, 400 + i * 150, l, { size: 120, anchor: 'middle' })));
  body += `<line x1="${W / 2 - 300}" y1="800" x2="${W / 2 + 300}" y2="800" stroke="${ACCENT}" stroke-width="6"/>`;
  body += text(W / 2, 900, 'FRANCIS BACON · OF STUDIES · 1625', { size: 52, fill: MUTED, anchor: 'middle', spacing: 10 });
  render('mug-bacon-wrap', W, H, body);
}

// --- 3. Cartaz "The Reader's Glossary": os nomes das 146 figuras, por grupo ---
{
  const W = 3600;
  const H = 4800;
  const M = 260;
  const inner = W - 2 * M;
  type Dev = { name: string; group: string };
  const devices: Dev[] = JSON.parse(readFileSync(join(process.cwd(), 'data', 'literary-devices.json'), 'utf8'));
  const groups: [string, string][] = [
    ['figurative', 'FIGURATIVE LANGUAGE'],
    ['sound', 'SOUND AND WORDPLAY'],
    ['repetition', 'REPETITION AND STRUCTURE'],
    ['narrative', 'NARRATIVE'],
    ['character', 'CHARACTER AND STYLE'],
  ];
  const top = 1000;
  const bottom = H - 420;

  function layout(size: number) {
    const lineH = size * 1.55;
    const rows: { group: string; lines: string[] }[] = [];
    let height = 0;
    for (const [key, label] of groups) {
      const names = devices.filter((d) => d.group === key).map((d) => d.name).sort((a, b) => a.localeCompare(b));
      const lines: string[] = [];
      let cur = '';
      for (const n of names) {
        const next = cur ? `${cur}  ·  ${n}` : n;
        if (emWidth(next) * size > inner && cur) {
          lines.push(cur);
          cur = n;
        } else cur = next;
      }
      if (cur) lines.push(cur);
      rows.push({ group: label, lines });
      height += 150 + lines.length * lineH + 70;
    }
    return { rows, lineH, height };
  }

  let size = 96;
  while (layout(size).height > bottom - top && size > 40) size -= 2;
  const { rows, lineH } = layout(size);

  let body = '';
  body += `<rect x="0" y="0" width="${W}" height="30" fill="${INK}"/>`;
  body += text(W / 2, 480, 'THE READER’S GLOSSARY', { size: 230, bold: true, anchor: 'middle', spacing: 18 });
  body += text(W / 2, 620, `${devices.length} figures and devices of literature`, { size: 84, fill: MUTED, anchor: 'middle' });
  body += `<line x1="${W / 2 - 500}" y1="720" x2="${W / 2 + 500}" y2="720" stroke="${INK}" stroke-width="8"/>`;
  let y = top;
  for (const r of rows) {
    body += text(W / 2, y + 60, r.group, { size: 58, fill: ACCENT, bold: true, anchor: 'middle', spacing: 14 });
    y += 150;
    for (const l of r.lines) {
      body += text(W / 2, y, l, { size, anchor: 'middle' });
      y += lineH;
    }
    y += 70;
  }
  body += `<line x1="${M}" y1="${H - 300}" x2="${W - M}" y2="${H - 300}" stroke="${INK}" stroke-width="5"/>`;
  body += text(W / 2, H - 180, 'A poem, an essay and a short story, every day.', { size: 76, fill: MUTED, anchor: 'middle' });
  render('poster-readers-glossary', W, H, body, PAPER);
  console.log(`  glossário: letra ${size}px`);
}

// --- 4. Cartaz "A Thousand Nights": mil círculos para preencher, um por noite ---
{
  const W = 3600;
  const H = 4800;
  const cols = 25;
  const rowsN = 40;
  const pitchX = 118;
  const pitchY = 82;
  const gridW = (cols - 1) * pitchX;
  const x0 = (W - gridW) / 2;
  const y0 = 1180;
  let body = `<rect x="0" y="0" width="${W}" height="30" fill="${INK}"/>`;
  body += text(W / 2, 430, 'A THOUSAND NIGHTS', { size: 250, bold: true, anchor: 'middle', spacing: 22 });
  body += text(W / 2, 600, 'One poem, one essay, one short story.', { size: 96, fill: MUTED, anchor: 'middle' });
  body += text(W / 2, 730, 'Fill in a circle for every night you read.', { size: 96, fill: MUTED, anchor: 'middle' });
  body += `<line x1="${W / 2 - 500}" y1="820" x2="${W / 2 + 500}" y2="820" stroke="${INK}" stroke-width="8"/>`;
  body += text(x0, 1000, 'NAME', { size: 44, fill: MUTED, bold: true, spacing: 8 });
  body += `<line x1="${x0 + 190}" y1="1000" x2="${x0 + 1150}" y2="1000" stroke="${INK}" stroke-width="3"/>`;
  body += text(x0 + gridW - 1500, 1000, 'STARTED', { size: 44, fill: MUTED, bold: true, spacing: 8 });
  body += `<line x1="${x0 + gridW - 1230}" y1="1000" x2="${x0 + gridW - 330}" y2="1000" stroke="${INK}" stroke-width="3"/>`;
  for (let r = 0; r < rowsN; r++) {
    for (let c = 0; c < cols; c++) {
      const n = r * cols + c + 1;
      const cx = x0 + c * pitchX;
      const cy = y0 + r * pitchY;
      const milestone = n % 100 === 0;
      body += `<circle cx="${cx}" cy="${cy}" r="${milestone ? 36 : 31}" fill="none" stroke="${milestone ? ACCENT : INK}" stroke-width="${milestone ? 7 : 3.5}"/>`;
      if (milestone) body += text(cx, cy + (n === 1000 ? 9 : 11), String(n), { size: n === 1000 ? 22 : 28, fill: ACCENT, bold: true, anchor: 'middle' });
    }
  }
  body += text(W / 2, H - 150, 'Every hundredth night is marked in red.', { size: 64, fill: MUTED, anchor: 'middle' });
  render('poster-thousand-nights-tracker', W, H, body, PAPER);
}
