import type { SourceContext } from '../lib/types.js';

/**
 * Percorre um endpoint da API REST do WordPress página a página.
 * Pede só os campos necessários (_fields), nunca o conteúdo integral dos textos.
 */
export async function* wpPages<T>(
  ctx: SourceContext,
  endpoint: string,
  params: Record<string, string | number>,
  perPage = 100,
): AsyncGenerator<T[]> {
  for (let page = 1; ; page++) {
    const qs = new URLSearchParams({ ...stringify(params), per_page: String(perPage), page: String(page) });
    let batch: T[];
    try {
      batch = await ctx.fetchJson<T[]>(`${endpoint}?${qs}`);
    } catch (e) {
      // O WordPress devolve 400 quando se pede uma página além da última.
      if (page > 1 && String(e).includes('HTTP 400')) return;
      throw e;
    }
    if (!Array.isArray(batch) || batch.length === 0) return;
    yield batch;
    if (batch.length < perPage) return;
  }
}

function stringify(o: Record<string, string | number>) {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)]));
}

/** Data ISO para o parâmetro `after`, com margem para publicações atrasadas. */
export function afterParam(lastRun: string | undefined, marginDays = 14): Record<string, string> {
  if (!lastRun) return {};
  const d = new Date(lastRun);
  d.setUTCDate(d.getUTCDate() - marginDays);
  return { after: d.toISOString().slice(0, 19) };
}
