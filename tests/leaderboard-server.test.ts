import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it } from 'vitest';
import { getBoard, postCheckin, postJoin, postLeave, postMe, type D1Database, type Env } from '../src/site/leaderboard-server.ts';

// O D1 é SQLite: este adaptador usa o SQLite do Node com a mesma migração.
function fakeD1(): D1Database {
  const db = new DatabaseSync(':memory:');
  for (const f of readdirSync('migrations').filter((n) => n.endsWith('.sql')).sort()) db.exec(readFileSync(`migrations/${f}`, 'utf8'));
  const statement = (query: string, values: unknown[] = []) => ({
    bind: (...v: unknown[]) => statement(query, v),
    first: async <T,>() => ((db.prepare(query).get(...(values as never[])) as T) ?? null),
    all: async <T,>() => ({ results: db.prepare(query).all(...(values as never[])) as T[] }),
    run: async () => db.prepare(query).run(...(values as never[])),
  });
  return {
    prepare: (q: string) => statement(q),
    batch: async (stmts) => Promise.all(stmts.map((s) => s.run())),
  };
}

const ORIGIN = 'https://bradburychallenge.org';
const post = (path: string, body: unknown, origin = ORIGIN) =>
  new Request(`${ORIGIN}/api/leaderboard/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify(body),
  });
const at = (day: string) => new Date(`${day}T12:00:00Z`);
const ana = 'a'.repeat(64);
const rui = 'b'.repeat(64);

let env: Env;
beforeEach(() => {
  env = { LEADERBOARD_DB: fakeD1() };
});

describe('leaderboard: servidor', () => {
  it('sem base de dados ligada responde 503', async () => {
    expect((await getBoard({})).status).toBe(503);
  });

  it('entrar exige consentimento, nome válido e nome livre', async () => {
    expect((await postJoin(post('join', { secret: ana, name: 'Ana' }), env)).status).toBe(400);
    expect((await postJoin(post('join', { secret: ana, name: 'x', consent: true }), env)).status).toBe(400);
    expect((await postJoin(post('join', { secret: ana, name: 'Ana', consent: true }), env)).status).toBe(200);
    expect((await postJoin(post('join', { secret: rui, name: 'ÁNA', consent: true }), env)).status).toBe(409);
    // O próprio leitor pode mudar de nome.
    expect((await postJoin(post('join', { secret: ana, name: 'Ana L.', consent: true }), env)).status).toBe(200);
  });

  it('recusa pedidos de outros sites', async () => {
    expect((await postJoin(post('join', { secret: ana, name: 'Ana', consent: true }, 'https://evil.example'), env)).status).toBe(403);
  });

  it('os dias contam pela data do servidor e fazem a semana e a sequência', async () => {
    await postJoin(post('join', { secret: ana, name: 'Ana', consent: true }), env, at('2026-11-20'));
    await postJoin(post('join', { secret: rui, name: 'Rui', consent: true }), env, at('2026-11-20'));
    for (const d of ['2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24']) {
      await postCheckin(post('checkin', { secret: ana }), env, at(d));
      await postCheckin(post('checkin', { secret: ana }), env, at(d)); // repetido: não conta duas vezes
    }
    await postCheckin(post('checkin', { secret: rui }), env, at('2026-11-24'));

    const board = await (await getBoard(env, at('2026-11-24'))).json();
    expect(board.weekStart).toBe('2026-11-23');
    expect(board.week).toEqual([
      { name: 'Ana', days: 2 },
      { name: 'Rui', days: 1 },
    ]);
    expect(board.streaks).toEqual([
      { name: 'Ana', streak: 5 },
      { name: 'Rui', streak: 1 },
    ]);

    const me = await (await postMe(post('me', { secret: ana }), env, at('2026-11-24'))).json();
    expect(me.me).toEqual({ name: 'Ana', streak: 5, best: 5, week: 2, imported: 0 });
  });

  it('quem não entrou não pode marcar dias', async () => {
    expect((await postCheckin(post('checkin', { secret: ana }), env)).status).toBe(404);
  });

  it('sair apaga o nome e os dias', async () => {
    await postJoin(post('join', { secret: ana, name: 'Ana', consent: true }), env, at('2026-11-24'));
    await postCheckin(post('checkin', { secret: ana }), env, at('2026-11-24'));
    expect((await postLeave(post('leave', { secret: ana }), env)).status).toBe(200);
    const board = await (await getBoard(env, at('2026-11-24'))).json();
    expect(board.week).toEqual([]);
    expect(board.streaks).toEqual([]);
    expect((await postMe(post('me', { secret: ana }), env)).status).toBe(404);
  });

  it('nomes escondidos pela moderação não aparecem', async () => {
    await postJoin(post('join', { secret: ana, name: 'Ana', consent: true }), env, at('2026-11-24'));
    await postCheckin(post('checkin', { secret: ana }), env, at('2026-11-24'));
    await env.LEADERBOARD_DB!.prepare('UPDATE readers SET hidden = 1').run();
    const board = await (await getBoard(env, at('2026-11-24'))).json();
    expect(board.week).toEqual([]);
    expect(board.streaks).toEqual([]);
  });

  it('na primeira entrada traz a sequência que o leitor já tinha, com limite e marca', async () => {
    const day = at('2026-11-30');
    await postJoin(post('join', { secret: ana, name: 'Ana', consent: true, history: { streak: 12, last: '2026-11-29' } }), env, day);
    await postCheckin(post('checkin', { secret: ana }), env, day);
    const board = await (await getBoard(env, day)).json();
    expect(board.streaks).toEqual([{ name: 'Ana', streak: 13, imported: true }]);
    expect(board.week).toEqual([{ name: 'Ana', days: 1 }]); // a semana só conta dias marcados depois de entrar
    const me = await (await postMe(post('me', { secret: ana }), env, day)).json();
    expect(me.me.imported).toBe(12);
  });

  it('mudar de nome não volta a importar', async () => {
    const day = at('2026-11-30');
    await postJoin(post('join', { secret: ana, name: 'Ana', consent: true }), env, day);
    await postJoin(post('join', { secret: ana, name: 'Ana L.', consent: true, history: { streak: 30, last: '2026-11-29' } }), env, day);
    const me = await (await postMe(post('me', { secret: ana }), env, day)).json();
    expect(me.me).toMatchObject({ name: 'Ana L.', streak: 0, imported: 0 });
  });

  it('depois das duas semanas não importa', async () => {
    const day = at('2026-12-08');
    await postJoin(post('join', { secret: ana, name: 'Ana', consent: true, history: { streak: 12, last: '2026-12-07' } }), env, day);
    const me = await (await postMe(post('me', { secret: ana }), env, day)).json();
    expect(me.me.streak).toBe(0);
  });

  it('se a sequência recomeça, deixa de estar marcada como importada', async () => {
    await postJoin(post('join', { secret: ana, name: 'Ana', consent: true, history: { streak: 5, last: '2026-11-29' } }), env, at('2026-11-30'));
    await postCheckin(post('checkin', { secret: ana }), env, at('2026-12-04')); // falhou vários dias
    const board = await (await getBoard(env, at('2026-12-04'))).json();
    expect(board.streaks).toEqual([{ name: 'Ana', streak: 1 }]);
  });
});
