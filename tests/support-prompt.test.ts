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

import { shouldShowFriends } from '../src/site/friends-popup.ts';

describe('janela Friends of the project', () => {
  const today = '2026-11-24';
  it('só aparece ao marcar o poema', () => {
    expect(shouldShowFriends({}, 'poem', true, today)).toBe(true);
    expect(shouldShowFriends({}, 'essay', true, today)).toBe(false);
    expect(shouldShowFriends({}, 'story', true, today)).toBe(false);
    expect(shouldShowFriends({}, 'poem', false, today)).toBe(false);
  });
  it('uma vez por dia', () => {
    expect(shouldShowFriends({ last: today }, 'poem', true, today)).toBe(false);
    expect(shouldShowFriends({ last: '2026-11-23' }, 'poem', true, today)).toBe(true);
  });
  it('nunca mais depois de fechada', () => {
    expect(shouldShowFriends({ last: '2026-11-01', closed: true }, 'poem', true, today)).toBe(false);
  });
});
