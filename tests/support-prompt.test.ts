import { describe, expect, it } from 'vitest';
import { QUIET_DAYS, isComplete, isQuiet, quietUntil } from '../src/site/support-prompt.ts';

describe('pedido de apoio', () => {
  it('só aparece com as três leituras do dia marcadas', () => {
    expect(isComplete(['poem', 'essay'])).toBe(false);
    expect(isComplete(['poem', 'poem', 'essay'])).toBe(false);
    expect(isComplete(['poem', 'essay', 'story'])).toBe(true);
    expect(isComplete(undefined)).toBe(false);
  });

  it('fica em silêncio 30 dias se for dispensado e 90 se o leitor seguir a ligação', () => {
    const now = Date.parse('2026-11-24T10:00:00Z');
    const dismissed = quietUntil(now, QUIET_DAYS.dismissed);
    expect(isQuiet(dismissed, now + 29 * 86_400_000)).toBe(true);
    expect(isQuiet(dismissed, now + 31 * 86_400_000)).toBe(false);
    expect(isQuiet(quietUntil(now, QUIET_DAYS.clicked), now + 89 * 86_400_000)).toBe(true);
    expect(isQuiet(undefined, now)).toBe(false);
  });
});
