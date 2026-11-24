// Leaderboard no browser: a chave secreta do leitor, o envio do dia completo e a página /leaderboard/.
// Só faz alguma coisa se o site tiver a leaderboard ligada (<meta name="bradbury-leaderboard">).
// Tudo falha em silêncio: sem rede ou sem a base de dados, o resto do site funciona na mesma.
import { importCandidate, type Board } from './leaderboard.js';
import type { Marks } from './stats.js';

const KEY = 'bradbury:leaderboard';
const API = '/api/leaderboard';

interface Saved {
  secret: string;
  name: string;
  /** Último dia (data do browser, Lisboa) já enviado, para não repetir pedidos. */
  sent?: string;
}

interface Me {
  name: string;
  streak: number;
  best: number;
  week: number;
  /** Dias trazidos de antes de entrar, se a sequência atual ainda os inclui. */
  imported?: number;
}

export const leaderboardEnabled = () => !!document.querySelector('meta[name="bradbury-leaderboard"]');

function load(): Saved | null {
  try {
    const s = JSON.parse(window.localStorage.getItem(KEY) ?? 'null');
    return s && typeof s.secret === 'string' && typeof s.name === 'string' ? (s as Saved) : null;
  } catch {
    return null;
  }
}

function save(s: Saved | null) {
  try {
    if (s) window.localStorage.setItem(KEY, JSON.stringify(s));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Sem armazenamento: o leitor terá de voltar a entrar.
  }
}

function newSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function call<T>(path: string, body: unknown): Promise<{ ok: boolean; status: number; data: T | { error?: string } }> {
  try {
    const res = await fetch(`${API}/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as T;
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: {} };
  }
}

/**
 * Chamado a cada marcação "Read" e ao abrir uma página: se o leitor está na leaderboard e marcou hoje as três
 * leituras de hoje, avisa o servidor (uma vez por dia). O servidor usa a sua própria data.
 */
export async function maybeCheckin(date: string, categories: string[] | undefined, today: string): Promise<Me | null> {
  if (!leaderboardEnabled() || date !== today || new Set(categories ?? []).size < 3) return null;
  const saved = load();
  if (!saved || saved.sent === today) return null;
  const res = await call<{ me: Me }>('checkin', { secret: saved.secret });
  if (res.ok) save({ ...saved, sent: today });
  else if (res.status === 404) save(null); // saiu noutro sítio ou foi apagado
  return res.ok && 'me' in res.data ? res.data.me : null;
}

/** Botões "Join the Leaderboard": para quem já entrou, passam a "See the leaderboard". */
export function updateLeaderboardButtons() {
  if (!load()) return;
  for (const a of document.querySelectorAll<HTMLElement>('[data-lb-cta]')) a.textContent = 'See the leaderboard';
}

// ---------- Página /leaderboard/ ----------

const ERRORS: Record<string, string> = {
  'bad-name': 'Please choose a name of 2 to 24 letters or numbers, without links.',
  'name-taken': 'That name is already taken. Please choose another.',
  'consent-required': 'Please tick the box to agree to show your name.',
  unavailable: 'The leaderboard is not available right now. Please try again later.',
};

const el = <T extends HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);

interface Row {
  name: string;
  value: number;
  imported?: boolean;
}

function renderRows(list: HTMLOListElement | null, rows: Row[], unit: (n: number) => string, mine?: string) {
  if (!list) return;
  list.replaceChildren(
    ...rows.map((r) => {
      const li = document.createElement('li');
      if (mine && r.name === mine) li.classList.add('is-me');
      const name = document.createElement('span');
      name.className = 'lb-name';
      name.textContent = r.name; // textContent: nunca HTML vindo de leitores
      const value = document.createElement('span');
      value.className = 'lb-value';
      value.textContent = unit(r.value);
      if (r.imported) {
        const mark = document.createElement('abbr');
        mark.className = 'lb-imported';
        mark.title = 'Includes days read before joining';
        mark.textContent = '*';
        value.append(mark);
      }
      li.append(name, value);
      return li;
    }),
  );
  const empty = list.nextElementSibling as HTMLElement | null;
  if (empty?.matches('[data-lb-empty]')) empty.hidden = rows.length > 0;
}

const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;

async function refreshBoard(mine?: string, fresh = false) {
  const status = el('[data-lb-status]');
  try {
    // Depois de uma ação do próprio leitor, ignora a cache do browser para ele se ver logo.
    const res = await fetch(API, { headers: { accept: 'application/json' }, cache: fresh ? 'no-cache' : 'default' });
    if (!res.ok) throw new Error(String(res.status));
    const board = (await res.json()) as Board;
    renderRows(el<HTMLOListElement>('[data-lb-week]'), board.week.map((r) => ({ name: r.name, value: r.days })), days, mine);
    renderRows(
      el<HTMLOListElement>('[data-lb-streaks]'),
      board.streaks.map((r) => ({ name: r.name, value: r.streak, imported: r.imported })),
      days,
      mine,
    );
    const legend = el('[data-lb-legend]');
    if (legend) legend.hidden = !board.streaks.some((r) => r.imported);
    if (status) status.hidden = true;
  } catch {
    if (status) {
      status.textContent = ERRORS.unavailable!;
      status.hidden = false;
    }
  }
}

function showMe(me: Me | null) {
  const joined = el('[data-lb-joined]');
  const form = el<HTMLFormElement>('[data-lb-form]');
  if (joined) joined.hidden = !me;
  if (form) form.hidden = !!me;
  const title = el('#lb-join-title');
  if (title) title.textContent = me ? 'Your place' : 'Join the leaderboard';
  if (!me) return;
  const set = (sel: string, text: string) => {
    const node = el(sel);
    if (node) node.textContent = text;
  };
  set('[data-lb-me-name]', me.name);
  set('[data-lb-me-streak]', me.imported ? `${days(me.streak)} (including ${days(me.imported)} before joining)` : days(me.streak));
  set('[data-lb-me-week]', days(me.week));
}

export function initLeaderboardPage(allMarks: () => Marks, today: () => string) {
  const page = el('[data-leaderboard-page]');
  if (!page) return;
  const firstDay = page.dataset.firstDay ?? today();
  const saved = load();
  showMe(null);
  void refreshBoard(saved?.name, !!saved);

  if (saved) {
    showMe({ name: saved.name, streak: 0, best: 0, week: 0 });
    void call<{ me: Me }>('me', { secret: saved.secret }).then((res) => {
      if (res.ok && 'me' in res.data) showMe(res.data.me);
      else if (res.status === 404) {
        save(null);
        showMe(null);
      }
    });
  }

  const form = el<HTMLFormElement>('[data-lb-form]');
  const error = el('[data-lb-error]');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const current = load();
    const secret = current?.secret ?? newSecret();
    const name = String(data.get('name') ?? '');
    const button = el<HTMLButtonElement>('button[type="submit"]', form);
    if (button) button.disabled = true;
    // Primeira entrada: leva a sequência que já tinha neste browser (o servidor decide se a aceita).
    const history = current ? undefined : (importCandidate(allMarks(), today(), firstDay) ?? undefined);
    const res = await call<{ me: Me }>('join', { secret, name, consent: data.get('consent') === 'on', history });
    if (button) button.disabled = false;
    if (res.ok && 'me' in res.data) {
      save({ secret, name: res.data.me.name });
      if (error) error.hidden = true;
      showMe(res.data.me);
      // Se hoje já está completo, conta já.
      const after = await maybeCheckin(today(), allMarks()[today()], today());
      if (after) showMe(after);
      void refreshBoard(res.data.me.name, true);
    } else if (error) {
      const code = (res.data as { error?: string }).error ?? 'unavailable';
      error.textContent = ERRORS[code] ?? ERRORS.unavailable!;
      error.hidden = false;
    }
  });

  el('[data-lb-rename]')?.addEventListener('click', () => {
    const current = load();
    if (!form) return;
    form.hidden = false;
    const input = el<HTMLInputElement>('input[name="name"]', form);
    if (input && current) input.value = current.name;
    input?.focus();
  });

  el('[data-lb-leave]')?.addEventListener('click', async () => {
    const current = load();
    if (!current) return;
    if (!window.confirm('Leave the leaderboard? Your name and your days on the leaderboard will be deleted.')) return;
    const res = await call('leave', { secret: current.secret });
    if (res.ok) {
      save(null);
      showMe(null);
      void refreshBoard(undefined, true);
    }
  });
}
