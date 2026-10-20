import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // As simulações de seleção (centenas de dias) levam alguns segundos; com a máquina ocupada
    // (por exemplo, um build em paralelo no CI) passavam o limite por omissão de 5 s.
    testTimeout: 30_000,
  },
});
