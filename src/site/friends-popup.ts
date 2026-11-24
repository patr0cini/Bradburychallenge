// Janela "Friends of the project", mostrada depois de o leitor marcar o poema como lido.
// Regras: no máximo uma vez por dia e nunca mais se o leitor a fechar (ou seguir a ligação).
// O estado fica só neste browser (localStorage); sem armazenamento, aparece no máximo uma vez por visita.

const KEY = 'bradbury:amigos';

export interface FriendsState {
  /** Último dia (AAAA-MM-DD, Lisboa) em que a janela foi mostrada. */
  last?: string;
  /** O leitor fechou a janela ou seguiu a ligação: não volta. */
  closed?: boolean;
}

/** Só se mostra ao marcar o poema, uma vez por dia, e nunca depois de fechada. */
export function shouldShowFriends(state: FriendsState, category: string, checked: boolean, today: string): boolean {
  if (category !== 'poem' || !checked) return false;
  if (state.closed) return false;
  return state.last !== today;
}

function readState(): FriendsState {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as FriendsState) : {};
  } catch {
    return {};
  }
}

function saveState(state: FriendsState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Sem armazenamento: a janela pode voltar na próxima visita.
  }
}

let shownThisVisit = false;
const dialog = () => document.querySelector<HTMLDialogElement>('[data-friends-popup]');

export function initFriendsPopup() {
  const el = dialog();
  if (!el) return;
  const close = () => {
    saveState({ ...readState(), closed: true });
    if (el.open) el.close();
  };
  el.querySelector('[data-friends-close]')?.addEventListener('click', close);
  el.querySelector('[data-friends-link]')?.addEventListener('click', close);
  // Escape e clicar fora (no fundo) também contam como fechar.
  el.addEventListener('cancel', () => saveState({ ...readState(), closed: true }));
  el.addEventListener('click', (e) => {
    if (e.target === el) close();
  });
}

/** Chamado a cada marcação "Read". */
export function maybeShowFriends(category: string, checked: boolean, today: string) {
  const el = dialog();
  if (!el || shownThisVisit || typeof el.showModal !== 'function') return;
  const state = readState();
  if (!shouldShowFriends(state, category, checked, today)) return;
  shownThisVisit = true;
  saveState({ ...state, last: today });
  el.showModal();
}
