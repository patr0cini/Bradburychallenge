// Notas editoriais.
//   npm run notes -- pending                         notas por rever e leituras sem nota
//   npm run notes -- approve <id...> | --date D      aprova notas (passam a aparecer no site)
//   npm run notes -- set <id> --text "..."           escreve ou corrige uma nota à mão (fica aprovada)
import { parseArgs } from 'node:util';
import { loadNotes, noteProblems, saveNotes } from '../src/lib/notes.js';
import { loadSchedule } from '../src/lib/schedule.js';
import { CATEGORIES } from '../src/lib/types.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { date: { type: 'string' }, text: { type: 'string' }, 'from-file': { type: 'string' } },
});
const [command, ...ids] = positionals;
const now = () => new Date().toISOString();
const schedule = loadSchedule();
const notes = loadNotes();

function pending() {
  for (const date of Object.keys(schedule).sort()) {
    for (const category of CATEGORIES) {
      const r = schedule[date]![category];
      const n = notes[r.id];
      if (n?.reviewed) continue;
      console.log(`\n${date} ${category.padEnd(5)} ${r.title} — ${r.author}\n  id: ${r.id}\n  ${r.url}`);
      console.log(n ? `  rascunho: ${n.text}\n  problemas: ${noteProblems(n.text).join('; ') || 'nenhum'}` : '  SEM NOTA (escrever à mão)');
    }
  }
}

function approve() {
  const targets = values.date ? CATEGORIES.map((c) => schedule[values.date!]?.[c].id).filter((x): x is string => !!x) : ids;
  for (const id of targets) {
    const n = notes[id];
    if (!n) {
      console.error(`${id}: não há nota`);
      continue;
    }
    n.reviewed = true;
    n.reviewedAt = now();
    console.log(`aprovada: ${id}`);
  }
  saveNotes(notes);
}

function set() {
  const [id] = ids;
  if (!id || !values.text) throw new Error('uso: npm run notes -- set <id> --text "..."');
  const problems = noteProblems(values.text);
  if (problems.length) console.warn(`aviso: ${problems.join('; ')}`);
  notes[id] = { text: values.text.trim(), reviewed: true, origin: 'human', updatedAt: now(), reviewedAt: now() };
  saveNotes(notes);
  console.log(`guardada e aprovada: ${id}`);
}

const commands: Record<string, () => unknown> = { pending, approve, set };
const run = commands[command ?? ''];
if (!run) {
  console.error('comandos: pending | approve | set');
  process.exit(1);
}
await run();
