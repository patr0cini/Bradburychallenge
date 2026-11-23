// Pedido de apoio discreto: aparece quando o leitor marca a terceira leitura do dia, e só nesse
// momento (não ao abrir a página). Fica em silêncio durante 30 dias se for dispensado e durante 90
// se o leitor seguir a ligação. O estado fica só neste browser (localStorage).

const KEY = 'bradbury:apoio';
const DAY_MS = 86_400_000;

export const QUIET_DAYS = { dismissed: 30, clicked: 90 } as const;

/** As três leituras do dia estão marcadas. */
export const isComplete = (categories: string[] | undefined) => new Set(categories ?? []).size >= 3;

/** Até quando o pedido fica em silêncio (milissegundos desde 1970). */
export const quietUntil = (now: number, days: number) => now + days * DAY_MS;

export const isQuiet = (until: number | undefined, now: number) => typeof until === 'number' && until > now;

function readUntil(): number | undefined {
  try {
    const n = Number(window.localStorage.getItem(KEY));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  } catch {
    return undefined;
  }
}

function saveQuiet(days: number) {
  try {
    window.localStorage.setItem(KEY, String(quietUntil(Date.now(), days)));
  } catch {
    // Sem armazenamento: o pedido pode voltar a aparecer na próxima visita.
  }
}

const prompt = () => document.querySelector<HTMLElement>('[data-support-prompt]');

/** Chamado depois de cada marcação "Read": mostra o pedido ao completar o dia, esconde-o se deixar de estar completo. */
export function updateSupportPrompt(categories: string[] | undefined) {
  const el = prompt();
  if (!el) return;
  el.hidden = !(isComplete(categories) && !isQuiet(readUntil(), Date.now()));
}

export function initSupportPrompt() {
  const el = prompt();
  if (!el) return;
  el.querySelector('[data-support-dismiss]')?.addEventListener('click', () => {
    saveQuiet(QUIET_DAYS.dismissed);
    el.hidden = true;
  });
  el.querySelector('[data-support-link]')?.addEventListener('click', () => {
    saveQuiet(QUIET_DAYS.clicked);
    el.hidden = true;
  });
}
