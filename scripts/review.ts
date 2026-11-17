// Página local para rever as notas editoriais: npm run review → http://localhost:4400
// Mostra as leituras sem nota aprovada (das mais recentes para as mais antigas). Cada nota pode ser
// editada e aprovada; as alterações ficam em data/notes.json (é preciso fazer commit e push depois).
import { createServer } from 'node:http';
import { loadNotes, noteProblems, saveNotes } from '../src/lib/notes.js';
import { loadSchedule } from '../src/lib/schedule.js';
import { CATEGORIES } from '../src/lib/types.js';

const PORT = Number(process.env.PORT || 4400);
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function page(message = ''): string {
  const schedule = loadSchedule();
  const notes = loadNotes();
  const rows: string[] = [];
  for (const date of Object.keys(schedule).sort().reverse()) {
    for (const category of CATEGORIES) {
      const r = schedule[date]![category];
      const n = notes[r.id];
      if (n?.reviewed) continue;
      const problems = n ? noteProblems(n.text) : [];
      rows.push(`<form method="post" action="/save" class="item">
  <p class="meta">${date} · ${category} · <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)}</a> — ${esc(r.author)}</p>
  <p class="state">${n ? 'Draft to review' : 'No note yet: write one'}${problems.length ? ` · <span class="warn">${esc(problems.join('; '))}</span>` : ''}</p>
  <input type="hidden" name="id" value="${esc(r.id)}">
  <textarea name="text" rows="5">${esc(n?.text ?? '')}</textarea>
  <button name="action" value="approve">Save and approve</button>
  <button name="action" value="save" class="secondary">Save draft</button>
</form>`);
    }
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Note review · Bradbury Challenge</title><style>
body{font:16px/1.5 system-ui,sans-serif;max-width:760px;margin:24px auto;padding:0 16px;color:#1d1b18;background:#fbfaf7}
.item{border:1px solid #e2ddd3;border-radius:10px;padding:14px;margin:0 0 14px;background:#fff}
.meta{margin:0;font-weight:600}.state{margin:4px 0 8px;color:#5c5750}.warn{color:#9a3412}
textarea{width:100%;box-sizing:border-box;font:inherit;padding:8px;border:1px solid #cfc8bb;border-radius:6px}
button{margin-top:8px;padding:6px 12px;border-radius:999px;border:1px solid #1d1b18;background:#1d1b18;color:#fff;font:inherit;cursor:pointer}
button.secondary{background:#fff;color:#1d1b18}.msg{background:#e2efdc;padding:8px 12px;border-radius:6px}
</style></head><body><h1>Notes to review</h1>${message ? `<p class="msg">${esc(message)}</p>` : ''}
${rows.length ? rows.join('\n') : '<p>Nothing to review.</p>'}
<p>When you are done: commit and push <code>data/notes.json</code> so the approved notes go live.</p></body></html>`;
}

createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const form = new URLSearchParams(body);
      const id = form.get('id') ?? '';
      const text = (form.get('text') ?? '').trim();
      const approve = form.get('action') === 'approve';
      const notes = loadNotes();
      const before = notes[id];
      const stamp = new Date().toISOString();
      if (id && text) {
        notes[id] = {
          text,
          reviewed: approve,
          origin: before && before.text === text ? before.origin : 'human',
          updatedAt: before && before.text === text ? before.updatedAt : stamp,
          ...(approve ? { reviewedAt: stamp } : {}),
        };
        saveNotes(notes);
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(page(!text ? 'Empty note: nothing saved.' : approve ? 'Approved.' : 'Draft saved.'));
    });
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(page());
}).listen(PORT, '127.0.0.1', () => console.log(`Revisão de notas: http://localhost:${PORT}`));
