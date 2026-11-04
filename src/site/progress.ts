// Contagem pessoal do desafio ("Day 3 of your 1,000"), guardada só neste browser (localStorage).
// Cada leitor escolhe o dia em que começou; o site não guarda nada no servidor.
import { lisbonToday, loadMarks } from './read-marks.ts';

const KEY = 'bradbury:inicio';
const GOAL = 1000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function loadStart(): string | undefined {
  try {
    const v = window.localStorage.getItem(KEY) ?? '';
    return ISO.test(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

function saveStart(date: string | undefined) {
  try {
    if (date) window.localStorage.setItem(KEY, date);
    else window.localStorage.removeItem(KEY);
  } catch {
    // Sem armazenamento: a contagem dura só enquanto a página estiver aberta.
  }
}

const noon = (iso: string) => Date.parse(`${iso}T12:00:00Z`);

/** Dia do desafio (1 = o dia de início) para uma data; 0 ou menos se for antes do início. */
export function personalDay(start: string, date: string): number {
  return Math.round((noon(date) - noon(start)) / 86_400_000) + 1;
}

export function dayLabel(n: number): string {
  const num = n.toLocaleString('en-GB');
  return n <= GOAL ? `Day ${num} of your ${GOAL.toLocaleString('en-GB')}` : `Day ${num} of your challenge`;
}

const longDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(noon(iso)),
  );

/** Leituras marcadas desde o início, e quantas houve (três por dia publicado). */
function tally(start: string, today: string, firstDay: string, lastDay: string) {
  const marks = loadMarks();
  let ticked = 0;
  for (const [date, cats] of Object.entries(marks)) if (date >= start && date <= today) ticked += cats.length;
  const from = start > firstDay ? start : firstDay;
  const to = lastDay < today ? lastDay : today;
  const days = Math.max(0, personalDay(from, to));
  return { ticked, total: days * 3 };
}

function render() {
  const start = loadStart();
  const today = lisbonToday();

  // Páginas de cada dia: "Day 3 of your 1,000", só se o dia for depois do início.
  for (const el of document.querySelectorAll<HTMLElement>('[data-personal-day]')) {
    const n = start ? personalDay(start, el.dataset.personalDay ?? '') : 0;
    el.textContent = n > 0 ? dayLabel(n) : '';
    el.hidden = n <= 0;
  }

  // Painel da página inicial.
  const panel = document.querySelector<HTMLElement>('[data-progress]');
  if (!panel) return;
  const none = panel.querySelector<HTMLElement>('[data-progress-none]');
  const active = panel.querySelector<HTMLElement>('[data-progress-active]');
  for (const input of panel.querySelectorAll<HTMLInputElement>('input[type=date]')) {
    input.max = today;
    if (start) input.value = start;
  }
  if (none) none.hidden = !!start;
  if (active) active.hidden = !start;
  if (start) {
    const n = Math.max(1, personalDay(start, today));
    const { ticked, total } = tally(start, today, panel.dataset.firstDay ?? start, panel.dataset.lastDay ?? today);
    const day = panel.querySelector('[data-progress-day]');
    const summary = panel.querySelector('[data-progress-summary]');
    if (day) day.textContent = dayLabel(n);
    if (summary)
      summary.textContent = `Started on ${longDate(start)}. ${ticked} of ${total} readings ticked since then.`;
  }
  panel.hidden = false;
}

export function initProgress() {
  const panel = document.querySelector<HTMLElement>('[data-progress]');
  panel?.querySelector('[data-progress-start]')?.addEventListener('click', () => {
    saveStart(lisbonToday());
    render();
  });
  for (const form of panel?.querySelectorAll<HTMLFormElement>('form[data-progress-form]') ?? []) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = (form.elements.namedItem('start') as HTMLInputElement | null)?.value ?? '';
      if (!ISO.test(value) || value > lisbonToday()) return;
      saveStart(value);
      form.closest('details')?.removeAttribute('open');
      render();
    });
  }
  panel?.querySelector('[data-progress-reset]')?.addEventListener('click', () => {
    if (!window.confirm('Stop counting your challenge? Your "Read" ticks are kept.')) return;
    saveStart(undefined);
    render();
  });
  // A contagem de leituras marcadas acompanha as caixas "Read".
  document.addEventListener('change', (e) => {
    if ((e.target as HTMLElement).matches?.('input[data-read-date]')) render();
  });
  render();
}
