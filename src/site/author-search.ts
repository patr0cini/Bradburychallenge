// Pesquisa no índice de autores: filtra, no browser, pelo nome e pelos títulos de cada autor.
// Sem JavaScript, o formulário fica escondido e a lista mostra-se toda.
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

/** Um autor corresponde se todas as palavras da pesquisa aparecerem no seu texto. */
export const matches = (haystack: string, query: string) => fold(query).split(/\s+/).every((w) => haystack.includes(w));

export function initAuthorSearch() {
  const form = document.querySelector<HTMLFormElement>('[data-author-search]');
  const input = form?.querySelector<HTMLInputElement>('input[type=search]');
  if (!form || !input) return;
  const status = form.querySelector<HTMLElement>('[data-author-status]');
  const none = document.querySelector<HTMLElement>('[data-author-none]');
  const items = [...document.querySelectorAll<HTMLElement>('li[data-search]')];
  const sections = [...document.querySelectorAll<HTMLElement>('section[data-letter]')];
  const letters = [...document.querySelectorAll<HTMLElement>('[data-letter-link]')];

  const apply = () => {
    const q = input.value;
    let shown = 0;
    for (const li of items) {
      const ok = !q.trim() || matches(li.dataset.search ?? '', q);
      li.hidden = !ok;
      if (ok) shown++;
    }
    const visible = new Set<string>();
    for (const s of sections) {
      s.hidden = !s.querySelector('li[data-search]:not([hidden])');
      if (!s.hidden) visible.add(s.dataset.letter ?? '');
    }
    for (const a of letters) a.hidden = !visible.has(a.dataset.letterLink ?? '');
    if (none) none.hidden = shown > 0;
    if (status) status.textContent = q.trim() ? `${shown} ${shown === 1 ? 'author' : 'authors'}` : '';
  };

  form.addEventListener('submit', (e) => e.preventDefault());
  input.addEventListener('input', apply);
  // ?q=orwell abre já filtrado (útil para ligações).
  const initial = new URLSearchParams(location.search).get('q');
  if (initial) input.value = initial;
  form.hidden = false;
  apply();
}
