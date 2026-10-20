import { describe, expect, it } from 'vitest';
import { accessFromHtml } from '../src/lib/access.js';

describe('accessFromHtml', () => {
  it('NYRB: página paga, com parte marcada como não livre', () => {
    const html = `<script type="application/ld+json">{"isAccessibleForFree":false,
      "hasPart":[{"@type":"WebPageElement","isAccessibleForFree":false,"cssSelector":".paywall-article"}]}</script>`;
    expect(accessFromHtml(html)).toBe(false);
  });
  it('NYRB: página livre', () => {
    expect(accessFromHtml('<script type="application/ld+json">{"isAccessibleForFree":true}</script>')).toBe(true);
  });
  it('LRB: valores em texto ("False")', () => {
    expect(accessFromHtml('{"isAccessibleForFree": "False"}')).toBe(false);
    expect(accessFromHtml('{"isAccessibleForFree": "True"}')).toBe(true);
  });
  it('livre no topo mas com uma parte paga conta como pago', () => {
    expect(accessFromHtml('{"isAccessibleForFree":true,"hasPart":[{"isAccessibleForFree":false}]}')).toBe(false);
  });
  it('sem dados estruturados: desconhecido', () => {
    expect(accessFromHtml('<html><body>texto</body></html>')).toBeNull();
  });
});
