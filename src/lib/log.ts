import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR } from './catalog.js';

const LOG_FILE = join(DATA_DIR, '..', 'logs', 'collect.log');

type Level = 'info' | 'warn' | 'error';

/** Escreve na consola e em logs/collect.log (não versionado no repositório). */
export function log(level: Level, scope: string, message: string) {
  const line = `${new Date().toISOString()} [${level}] ${scope}: ${message}`;
  (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(line);
  try {
    mkdirSync(join(LOG_FILE, '..'), { recursive: true });
    appendFileSync(LOG_FILE, line + '\n');
  } catch {
    // O log em ficheiro é auxiliar; a consola chega.
  }
}
