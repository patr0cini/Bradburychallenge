// Desenhos para produtos (tote bag, caneca, cartazes) em PNG de alta resolução, em merch/out/.
//   npm run merch
// Usam só texto nosso e citações em domínio público: nada de nome, citações ou assinatura de Bradbury
// (ver merch/README.md). A marca nos produtos é "RB Challenge". Fonte: PT Serif (licença OFL, em
// assets/fonts), que se pode usar em produtos.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { Resvg } from '@resvg/resvg-js';

const OUT = join(process.cwd(), 'merch', 'out');
const FONTS = ['PT_Serif-Web-Regular.ttf', 'PT_Serif-Web-Bold.ttf'].map((f) => join(process.cwd(), 'assets', 'fonts', f));
const INK = '#1d1b18';
const PAPER = '#fbfaf7';
const MUTED = '#5c5750';
const ACCENT = '#b3121f';
const BRAND = 'RB CHALLENGE';

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
  const img = new Resvg(svg, { font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'PT Serif' } }).render();
  const png = img.asPng();
  writeFileSync(join(outDir, `${name}.png`), png);
  console.log(`${name}.png  ${width}×${height}  ${(png.length / 1e6).toFixed(1)} MB`);
  return img;
}

/** PDF de uma página A3 com a imagem inteira (RGB comprimido; o fundo é opaco). Impressoras e visualizadores ajustam a A4. */
function writePdf(name: string, img: { width: number; height: number; pixels: Buffer }) {
  const pw = 841.89;
  const ph = 1190.55;
  const px = img.pixels; // cada acesso a img.pixels copia a imagem toda: lê-se uma só vez
  const rgb = Buffer.alloc(img.width * img.height * 3);
  for (let i = 0, j = 0; i < px.length; i += 4, j += 3) {
    rgb[j] = px[i]!;
    rgb[j + 1] = px[i + 1]!;
    rgb[j + 2] = px[i + 2]!;
  }
  const data = deflateSync(rgb, { level: 9 });
  const content = Buffer.from(`q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`);
  const parts: Buffer[] = [Buffer.from('%PDF-1.4\n')];
  const offsets: number[] = [];
  let pos = parts[0]!.length;
  const add = (...chunks: (string | Buffer)[]) => {
    offsets.push(pos);
    for (const c of chunks) {
      const b = typeof c === 'string' ? Buffer.from(c, 'latin1') : c;
      parts.push(b);
      pos += b.length;
    }
  };
  add('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  add('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  add(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
  add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${data.length} >>\nstream\n`, data, '\nendstream\nendobj\n');
  add(`5 0 obj\n<< /Length ${content.length} >>\nstream\n`, content, '\nendstream\nendobj\n');
  const xref = pos;
  let tail = `xref\n0 6\n0000000000 65535 f \n`;
  for (const o of offsets) tail += `${String(o).padStart(10, '0')} 00000 n \n`;
  tail += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  parts.push(Buffer.from(tail, 'latin1'));
  const pdf = Buffer.concat(parts);
  writeFileSync(join(outDir, `${name}.pdf`), pdf);
  console.log(`${name}.pdf  A3  ${(pdf.length / 1e6).toFixed(1)} MB`);
}

let outDir = OUT;
mkdirSync(OUT, { recursive: true });

// --- 1. Tote bag: fundo transparente, em tinta escura (para tecido claro) e em branco (para tecido escuro) ---
function tote(ink: string, name: string, W = 4500, H = 5400) {
  const lines = ['One poem.', 'One essay.', 'One story.'];
  let body = '';
  const k = W / 4500;
  lines.forEach((l, i) => (body += text(W / 2, (1700 + i * 520) * k, l, { size: 430 * k, fill: ink, anchor: 'middle' })));
  body += `<line x1="${W / 2 - 700 * k}" y1="${3500 * k}" x2="${W / 2 + 700 * k}" y2="${3500 * k}" stroke="${ink}" stroke-width="${14 * k}"/>`;
  body += text(W / 2, 4000 * k, 'EVERY DAY.', { size: 300 * k, fill: ink, bold: true, anchor: 'middle', spacing: 60 * k });
  body += text(W / 2, 4900 * k, BRAND, { size: 130 * k, fill: ink, bold: true, anchor: 'middle', spacing: 50 * k });
  render(name, W, H, body);
}
tote(INK, 'tote-bag-dark-ink');
tote('#ffffff', 'tote-bag-white-ink');

// --- 2. Caneca (11 oz, volta inteira): citação de Francis Bacon, "Of Studies" (1625), em domínio público ---
function mug(name: string, W: number, H: number) {
  const cy = H / 2;
  let body = '';
  const q = ['Reading maketh a full man;', 'conference a ready man;', 'and writing an exact man.'];
  q.forEach((l, i) => (body += text(W / 2, cy - 170 + i * 150, l, { size: 120, anchor: 'middle' })));
  body += `<line x1="${W / 2 - 300}" y1="${cy + 230}" x2="${W / 2 + 300}" y2="${cy + 230}" stroke="${ACCENT}" stroke-width="6"/>`;
  body += text(W / 2, cy + 330, 'FRANCIS BACON · OF STUDIES · 1625', { size: 52, fill: MUTED, anchor: 'middle', spacing: 10 });
  body += text(W / 2, cy + 450, BRAND, { size: 44, fill: INK, bold: true, anchor: 'middle', spacing: 24 });
  render(name, W, H, body);
}
mug('mug-bacon-wrap', 2820, 1080);

// --- 3. Cartaz "The Reader's Glossary": os nomes das 146 figuras, por grupo ---
type Dev = { name: string; group: string };
const devices: Dev[] = JSON.parse(readFileSync(join(process.cwd(), 'data', 'literary-devices.json'), 'utf8'));

function glossary(name: string, W: number, H: number, pdf = false) {
  const M = Math.round(W * 0.072);
  const inner = W - 2 * M;
  const k = W / 3600;
  const groups: [string, string][] = [
    ['figurative', 'FIGURATIVE LANGUAGE'],
    ['sound', 'SOUND AND WORDPLAY'],
    ['repetition', 'REPETITION AND STRUCTURE'],
    ['narrative', 'NARRATIVE'],
    ['character', 'CHARACTER AND STYLE'],
  ];
  const top = 1000 * k;
  const bottom = H - 480 * k;

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
      height += 150 * k + lines.length * lineH + 70 * k;
    }
    return { rows, lineH, height };
  }

  let size = 96 * k;
  while (layout(size).height > bottom - top && size > 40 * k) size -= 2 * k;
  const { rows, lineH } = layout(size);

  let body = '';
  body += `<rect x="0" y="0" width="${W}" height="${30 * k}" fill="${INK}"/>`;
  body += text(W / 2, 480 * k, 'THE READER’S GLOSSARY', { size: 230 * k, bold: true, anchor: 'middle', spacing: 18 * k });
  body += text(W / 2, 620 * k, `${devices.length} figures and devices of literature`, { size: 84 * k, fill: MUTED, anchor: 'middle' });
  body += `<line x1="${W / 2 - 500 * k}" y1="${720 * k}" x2="${W / 2 + 500 * k}" y2="${720 * k}" stroke="${INK}" stroke-width="${8 * k}"/>`;
  let y = top;
  for (const r of rows) {
    body += text(W / 2, y + 60 * k, r.group, { size: 58 * k, fill: ACCENT, bold: true, anchor: 'middle', spacing: 14 * k });
    y += 150 * k;
    for (const l of r.lines) {
      body += text(W / 2, y, l, { size, anchor: 'middle' });
      y += lineH;
    }
    y += 70 * k;
  }
  body += `<line x1="${M}" y1="${H - 330 * k}" x2="${W - M}" y2="${H - 330 * k}" stroke="${INK}" stroke-width="${5 * k}"/>`;
  body += text(W / 2, H - 230 * k, 'A poem, an essay and a short story, every day.', { size: 76 * k, fill: MUTED, anchor: 'middle' });
  body += text(W / 2, H - 120 * k, BRAND, { size: 56 * k, bold: true, anchor: 'middle', spacing: 30 * k });
  const img = render(name, W, H, body, PAPER);
  if (pdf) writePdf(name, img);
}
glossary('poster-readers-glossary', 3600, 4800);
glossary('print-a3-readers-glossary', 3508, 4961, true);

// --- 4. Cartaz "A Thousand Nights": mil círculos para preencher, um por noite ---
function tracker(name: string, W: number, H: number, pdf = false) {
  const k = W / 3600;
  const cols = 25;
  const rowsN = 40;
  const pitchX = 118 * k;
  const gridTop = 1180 * k;
  const gridBottom = H - 330 * k;
  const pitchY = (gridBottom - gridTop) / (rowsN - 1);
  const gridW = (cols - 1) * pitchX;
  const x0 = (W - gridW) / 2;
  const r = Math.min(31 * k, pitchY * 0.38);
  let body = `<rect x="0" y="0" width="${W}" height="${30 * k}" fill="${INK}"/>`;
  body += text(W / 2, 430 * k, 'A THOUSAND NIGHTS', { size: 250 * k, bold: true, anchor: 'middle', spacing: 22 * k });
  body += text(W / 2, 600 * k, 'One poem, one essay, one short story.', { size: 96 * k, fill: MUTED, anchor: 'middle' });
  body += text(W / 2, 730 * k, 'Fill in a circle for every night you read.', { size: 96 * k, fill: MUTED, anchor: 'middle' });
  body += `<line x1="${W / 2 - 500 * k}" y1="${820 * k}" x2="${W / 2 + 500 * k}" y2="${820 * k}" stroke="${INK}" stroke-width="${8 * k}"/>`;
  body += text(x0, 1000 * k, 'NAME', { size: 44 * k, fill: MUTED, bold: true, spacing: 8 * k });
  body += `<line x1="${x0 + 190 * k}" y1="${1000 * k}" x2="${x0 + 1150 * k}" y2="${1000 * k}" stroke="${INK}" stroke-width="${3 * k}"/>`;
  body += text(x0 + gridW - 1500 * k, 1000 * k, 'STARTED', { size: 44 * k, fill: MUTED, bold: true, spacing: 8 * k });
  body += `<line x1="${x0 + gridW - 1230 * k}" y1="${1000 * k}" x2="${x0 + gridW - 330 * k}" y2="${1000 * k}" stroke="${INK}" stroke-width="${3 * k}"/>`;
  for (let row = 0; row < rowsN; row++) {
    for (let c = 0; c < cols; c++) {
      const n = row * cols + c + 1;
      const cx = x0 + c * pitchX;
      const cy = gridTop + row * pitchY;
      const milestone = n % 100 === 0;
      body += `<circle cx="${cx}" cy="${cy}" r="${milestone ? r * 1.16 : r}" fill="none" stroke="${milestone ? ACCENT : INK}" stroke-width="${(milestone ? 7 : 3.5) * k}"/>`;
      if (milestone) body += text(cx, cy + (n === 1000 ? 9 : 11) * k, String(n), { size: (n === 1000 ? 22 : 28) * k, fill: ACCENT, bold: true, anchor: 'middle' });
    }
  }
  body += text(W / 2, H - 200 * k, 'Every hundredth night is marked in red.', { size: 64 * k, fill: MUTED, anchor: 'middle' });
  body += text(W / 2, H - 100 * k, BRAND, { size: 56 * k, bold: true, anchor: 'middle', spacing: 30 * k });
  const img = render(name, W, H, body, PAPER);
  if (pdf) writePdf(name, img);
}
tracker('poster-thousand-nights-tracker', 3600, 4800);
tracker('print-a3-thousand-nights-tracker', 3508, 4961, true);

// --- 5. Redbubble: tamanhos do guia oficial "Dimensions & Format" (atualizado a 26 de outubro de 2026) ---
// Só aceita JPEG e PNG. Cotton tote 2400 × 3200 e Premium T-shirt 2875 × 3900 (mesmo ficheiro de 3600 × 4800,
// proporção 3:4), caneca standard 2700 × 1120 e alta 2700 × 1624, sticker 2800 × 2800 (cobre os quatro
// tamanhos) e cartazes até ao tamanho grande, 8310 × 11790.
outDir = join(OUT, 'redbubble');
mkdirSync(outDir, { recursive: true });
tote(INK, 'rb-tote-and-tshirt-one-poem-one-essay-one-story', 3600, 4800);
mug('rb-mug-standard-bacon', 2700, 1120);
mug('rb-mug-tall-bacon', 2700, 1624);
{
  const W = 2800;
  let body = '';
  ['One poem.', 'One essay.', 'One story.'].forEach((l, i) => (body += text(W / 2, 760 + i * 380, l, { size: 330, anchor: 'middle' })));
  body += `<line x1="${W / 2 - 520}" y1="1990" x2="${W / 2 + 520}" y2="1990" stroke="${INK}" stroke-width="10"/>`;
  body += text(W / 2, 2290, 'EVERY DAY.', { size: 220, bold: true, anchor: 'middle', spacing: 44 });
  body += text(W / 2, 2560, BRAND, { size: 96, bold: true, anchor: 'middle', spacing: 36 });
  render('rb-sticker-one-poem-one-essay-one-story', W, W, body);
}
glossary('rb-poster-readers-glossary', 8310, 11790);
tracker('rb-poster-thousand-nights-tracker', 8310, 11790);
