import { describe, expect, it } from 'vitest';
import { cleanSupporters } from '../src/site/supporters.js';

describe('lista de apoiantes', () => {
  it('limpa espaços, tira vazios e repetidos e ordena', () => {
    expect(cleanSupporters(['  Zé  Silva ', 'ana', 'Ana', '', '   ', 3, null])).toEqual(['ana', 'Zé Silva']);
    expect(cleanSupporters('não é lista')).toEqual([]);
    expect(cleanSupporters(['x'.repeat(100)])[0]).toHaveLength(60);
  });
});
