import { initFriendsPopup, maybeShowFriends } from './friends-popup.ts';
import { initLeaderboardPage, maybeCheckin, updateLeaderboardButtons } from './leaderboard-client.ts';
import { initSupportPrompt, updateSupportPrompt } from './support-prompt.ts';

// Marcações "Lido", guardadas só neste browser (localStorage).
// Todas as leituras e escritas estão protegidas: se o armazenamento falhar, o site funciona na mesma.

type Marks = Record<string, string[]>; // { "2026-10-17": ["poem", "story"] }

const KEY = 'bradbury:lidos';

export function loadMarks(): Marks {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Marks) : {};
  } catch {
    return {};
  }
}

function save(marks: Marks) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(marks));
  } catch {
    // Sem armazenamento (modo privado, bloqueio): a marcação dura só enquanto a página estiver aberta.
  }
}

/** Data de hoje em Lisboa, AAAA-MM-DD. */
export function lisbonToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(),
  );
}

export function initReadMarks() {
  let marks = loadMarks();
  initSupportPrompt();
  initFriendsPopup();
  // Leaderboard: se hoje já está completo (por exemplo, marcado sem rede), envia agora; e liga a página.
  void maybeCheckin(lisbonToday(), marks[lisbonToday()], lisbonToday());
  initLeaderboardPage(loadMarks, lisbonToday);
  updateLeaderboardButtons();

  for (const box of document.querySelectorAll<HTMLInputElement>('input[data-read-date]')) {
    const { readDate: date = '', readCategory: category = '' } = box.dataset;
    box.checked = (marks[date] ?? []).includes(category);
    box.addEventListener('change', () => {
      marks = loadMarks(); // outro separador pode ter mudado entretanto
      const set = new Set(marks[date] ?? []);
      if (box.checked) set.add(category);
      else set.delete(category);
      if (set.size) marks[date] = [...set];
      else delete marks[date];
      save(marks);
      updateSupportPrompt(marks[date]);
      maybeShowFriends(category, box.checked, lisbonToday());
      void maybeCheckin(date, marks[date], lisbonToday());
    });
  }

  // Arquivo: cheio se os três foram lidos, contorno se só parte, nada se nenhum.
  for (const dot of document.querySelectorAll<HTMLElement>('[data-read-indicator]')) {
    const n = (marks[dot.dataset.readIndicator ?? ''] ?? []).length;
    dot.classList.toggle('is-full', n >= 3);
    dot.classList.toggle('is-partial', n > 0 && n < 3);
    const label = dot.querySelector('.visually-hidden');
    const { labelFull = '', labelPartial = '' } = dot.dataset;
    if (label) label.textContent = n >= 3 ? labelFull : n > 0 ? labelPartial.replace('{n}', String(n)) : '';
  }

  // Página Hoje: se a seleção mostrada já não é a de hoje (antes do deploy diário), avisa.
  const stale = document.querySelector<HTMLElement>('[data-stale-check]');
  if (stale && !stale.dataset.static) {
    const shown = stale.dataset.staleCheck ?? '';
    const today = lisbonToday();
    if (shown && shown < today) {
      const yesterday = new Date(`${today}T12:00:00Z`);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      // Os textos vêm da página, na língua dela.
      stale.textContent =
        (shown === yesterday.toISOString().slice(0, 10) ? stale.dataset.yesterdayText : stale.dataset.olderText) ?? '';
      stale.hidden = false;
    }
  }
}
