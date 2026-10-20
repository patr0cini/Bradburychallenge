import { join } from 'node:path';
import { PoliteClient } from './http.js';
import { DATA_DIR, loadCatalog, mergeIntoCatalog, readJson, saveCatalog, writeJson } from './catalog.js';
import { log } from './log.js';
import { CATEGORIES, type Category, type CollectResult } from './types.js';
import { allSources, type RegisteredSource } from '../sources/index.js';

interface SourceState {
  lastRun?: string;
  lastAttempt?: string;
  lastError?: string;
}

const STATE_FILE = join(DATA_DIR, 'state', 'sources.json');
const EXCLUDED_FILE = join(DATA_DIR, 'state', 'excluded.json');

export interface CollectOptions {
  /** Só estas fontes (ids). */
  sources?: string[];
  /** Só as fontes que alimentam esta categoria. */
  category?: Category;
  /** Ignora o intervalo mínimo entre recolhas. */
  force?: boolean;
  /** Recolha completa, em vez de só as novidades. */
  full?: boolean;
}

/**
 * Atualiza os catálogos a partir das fontes. As fontes correm em paralelo (cada site tem o
 * seu próprio crawl-delay); a junção aos catálogos é feita uma fonte de cada vez.
 * Uma fonte que falha fica registada e não impede as outras.
 * Devolve o número de textos novos acrescentados.
 */
export async function runCollection(opts: CollectOptions = {}): Promise<{ added: number; failures: number }> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const state = readJson<Record<string, SourceState>>(STATE_FILE, {});
  const excluded = readJson<Record<string, Record<string, string>>>(EXCLUDED_FILE, {});
  const client = new PoliteClient();
  const daysSince = (iso?: string) => (iso ? (now.getTime() - new Date(iso).getTime()) / 86_400_000 : Infinity);
  let failures = 0;
  let added = 0;
  let mergeQueue = Promise.resolve();

  const knownUrlsFor = (sourceId: string) =>
    new Set<string>([
      ...CATEGORIES.flatMap((c) => loadCatalog(c).filter((i) => i.source === sourceId).map((i) => i.url)),
      ...Object.keys(excluded[sourceId] ?? {}),
    ]);

  async function runSource({ source, refreshDays }: RegisteredSource) {
    const st = (state[source.id] ??= {});
    if (!opts.force && daysSince(st.lastRun) < refreshDays) {
      log('info', source.id, `recolhida há ${daysSince(st.lastRun).toFixed(1)} dias; intervalo mínimo de ${refreshDays} dias`);
      return;
    }

    log('info', source.id, `início da recolha (${opts.full || !st.lastRun ? 'completa' : 'incremental'})`);
    st.lastAttempt = now.toISOString();
    let result: CollectResult;
    try {
      result = await source.collect({
        fetchText: (u) => client.text(u),
        fetchJson: (u) => client.json(u),
        log: (m) => log('info', source.id, m),
        knownUrls: opts.full ? new Set() : knownUrlsFor(source.id),
        lastRun: opts.full ? undefined : st.lastRun,
      });
    } catch (e) {
      failures++;
      st.lastError = `${today}: ${e instanceof Error ? e.message : String(e)}`;
      log('error', source.id, st.lastError);
      writeJson(STATE_FILE, state);
      return;
    }

    const merge = () => {
      for (const category of CATEGORIES) {
        if (!source.categories.includes(category)) continue;
        const { catalog, stats } = mergeIntoCatalog(loadCatalog(category), source.id, category, result, today);
        saveCatalog(category, catalog);
        added += stats.added;
        if (stats.suspiciousDeactivations)
          log(
            'warn',
            source.id,
            `${category}: a recolha deixou de ver ${stats.suspiciousDeactivations} textos de uma vez; não foram desativados (verificar a fonte)`,
          );
        log(
          'info',
          source.id,
          `${category}: +${stats.added} novos, ${stats.updated} atualizados, ${stats.deactivated} inativos, ${stats.skippedDuplicates} duplicados`,
        );
      }
      if (result.excluded) {
        // Numa recolha --full a lista de exclusões é refeita; nas outras, acrescenta-se
        // (as fontes saltam os URLs já excluídos e não os voltam a reportar).
        if (opts.full && result.complete) excluded[source.id] = {};
        const bucket = (excluded[source.id] ??= {});
        for (const { url, reason } of result.excluded) bucket[url] = reason;
        writeJson(EXCLUDED_FILE, excluded);
        log('info', source.id, `${result.excluded.length} textos excluídos (ver data/state/excluded.json)`);
      }
      st.lastRun = now.toISOString();
      delete st.lastError;
      writeJson(STATE_FILE, state);
    };
    await (mergeQueue = mergeQueue.then(merge));
  }

  const selected = allSources().filter(
    ({ source }) =>
      (!opts.sources || opts.sources.includes(source.id)) && (!opts.category || source.categories.includes(opts.category)),
  );
  await Promise.all(selected.map(runSource));
  if (failures > 0) log('warn', 'collect', `${failures} fonte(s) falharam; os catálogos das outras foram atualizados`);
  return { added, failures };
}
