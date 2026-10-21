import { describe, expect, it } from 'vitest';
import type { SiteDay } from '../src/site/data.js';
import { digestHtml, socialText } from '../src/site/digest.js';
import { dayImage, dayImageSvg } from '../src/site/og-image.js';

const graphemes = (s: string) => [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].length;

function day(title = 'Hills'): SiteDay {
  const reading = (category: 'poem' | 'essay' | 'story', t: string) => ({
    id: `x:${category}`,
    category,
    title: t,
    author: 'Ana <Autora> & Filhos',
    url: `https://example.org/${category}?a=1&b=2`,
    source: 'x',
    siteName: 'Example',
    paywalled: false,
    previousUses: 0,
    unavailable: false,
  });
  return { date: '2026-10-21', number: 2, readings: [reading('poem', title), reading('essay', title), reading('story', title)] };
}

describe('resumo do dia', () => {
  it('cabe no limite do Bluesky mesmo com títulos muito longos, e acaba na ligação', () => {
    const text = socialText(day('A very long title about melancholy, ghosts and the art of the novel '.repeat(4)), 300);
    expect(graphemes(text)).toBeLessThanOrEqual(300);
    expect(text.split('\n').at(-1)).toBe('https://bradburychallenge.org/2026/10/21/');
  });

  it('escapa o HTML dos títulos, autores e ligações', () => {
    const html = digestHtml(day('<script>'));
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;Autora&gt; &amp; Filhos');
    expect(html).toContain('?a=1&amp;b=2');
  });
});

describe('imagem de partilha', () => {
  it('gera um PNG de 1200 × 630 com o texto escapado', () => {
    expect(dayImageSvg(day('A & B <C>'))).toContain('A &amp; B &lt;C&gt;');
    const png = dayImage(day());
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });
});
