// Leaderboard: pedidos HTTP tratados pelas Cloudflare Pages Functions (pasta functions/), com a base D1
// ligada como LEADERBOARD_DB no projeto do Pages. Ver docs/leaderboard.md e migrations/0001_leaderboard.sql.
//
// Privacidade: guardamos o nome escolhido, o hash SHA-256 da chave secreta do leitor (a chave fica só no
// browser dele) e os dias completados. Nenhum IP, e-mail ou cookie. Sair apaga tudo.
import {
  TOP,
  applyCheckin,
  importedState,
  keepImported,
  cleanName,
  lisbonDate,
  liveStreak,
  nameKey,
  topStreaks,
  validSecret,
  weekStart,
  addDays,
  type Board,
  type StreakState,
  type WeekRow,
} from './leaderboard.js';

// Tipos mínimos da API do D1 (evitam depender de @cloudflare/workers-types).
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

export interface Env {
  LEADERBOARD_DB?: D1Database;
}

interface ReaderRow {
  id: string;
  name: string;
  streak: number;
  best: number;
  last_day: string | null;
  rest_day: string | null;
  imported: number;
}

const MAX_BODY = 2048;

function json(body: unknown, status = 200, cache = 'no-store'): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache, 'x-robots-tag': 'noindex' },
  });
}

const fail = (error: string, status: number) => json({ error }, status);

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) return null;
  const text = await request.text();
  if (text.length > MAX_BODY) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Só aceita pedidos vindos do próprio site (o browser envia sempre Origin num POST com fetch). */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

export async function readerId(secret: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const toState = (r: ReaderRow): StreakState => ({ streak: r.streak, best: r.best, last: r.last_day, rest: r.rest_day });

async function findReader(db: D1Database, id: string) {
  return db.prepare('SELECT id, name, streak, best, last_day, rest_day, imported FROM readers WHERE id = ?1').bind(id).first<ReaderRow>();
}

async function weekDays(db: D1Database, id: string, today: string) {
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM checkins WHERE reader_id = ?1 AND day >= ?2 AND day <= ?3')
    .bind(id, weekStart(today), today)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

async function me(db: D1Database, reader: ReaderRow, today: string) {
  const streak = liveStreak(toState(reader), today);
  return {
    name: reader.name,
    streak,
    best: reader.best,
    week: await weekDays(db, reader.id, today),
    imported: streak > 0 ? reader.imported : 0,
  };
}

/** GET /api/leaderboard: as duas tabelas (semana e sequências). Guardada em cache 2 minutos. */
export async function getBoard(env: Env, now = new Date()): Promise<Response> {
  const db = env.LEADERBOARD_DB;
  if (!db) return fail('unavailable', 503);
  const today = lisbonDate(now);
  const start = weekStart(today);
  const week = await db
    .prepare(
      `SELECT r.name AS name, COUNT(*) AS days FROM checkins c JOIN readers r ON r.id = c.reader_id
       WHERE c.day >= ?1 AND c.day <= ?2 AND r.hidden = 0
       GROUP BY c.reader_id ORDER BY days DESC, MIN(c.day) ASC, r.name ASC LIMIT ?3`,
    )
    .bind(start, today, TOP)
    .all<WeekRow>();
  // Só leitores com atividade nos últimos dias podem ter uma sequência viva.
  const recent = await db
    .prepare(
      `SELECT name, streak, best, last_day AS last, rest_day AS rest, imported FROM readers
       WHERE hidden = 0 AND streak > 0 AND last_day >= ?1 ORDER BY streak DESC LIMIT ?2`,
    )
    .bind(addDays(today, -2), TOP * 5)
    .all<{ name: string; imported: number } & StreakState>();
  const board: Board = { today, weekStart: start, week: week.results, streaks: topStreaks(recent.results, today) };
  return json(board, 200, 'public, max-age=120');
}

/** POST /api/leaderboard/join {secret, name}: entra (ou muda de nome). */
export async function postJoin(request: Request, env: Env, now = new Date()): Promise<Response> {
  const db = env.LEADERBOARD_DB;
  if (!db) return fail('unavailable', 503);
  if (!sameOrigin(request)) return fail('forbidden', 403);
  const body = await readBody(request);
  if (!body || !validSecret(body.secret)) return fail('bad-request', 400);
  if (body.consent !== true) return fail('consent-required', 400);
  const name = cleanName(body.name);
  if (!name) return fail('bad-name', 400);
  const id = await readerId(body.secret);
  const key = nameKey(name);
  const taken = await db.prepare('SELECT id FROM readers WHERE name_key = ?1').bind(key).first<{ id: string }>();
  if (taken && taken.id !== id) return fail('name-taken', 409);
  const today = lisbonDate(now);
  const existing = await findReader(db, id);
  if (existing) {
    // Já estava na leaderboard: só muda de nome (a importação é só na primeira entrada).
    await db.prepare('UPDATE readers SET name = ?2, name_key = ?3 WHERE id = ?1').bind(id, name, key).run();
  } else {
    const start = importedState(body.history, today);
    await db
      .prepare(
        `INSERT INTO readers (id, name, name_key, created, streak, best, last_day, rest_day, imported)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
      )
      .bind(id, name, key, today, start?.streak ?? 0, start?.best ?? 0, start?.last ?? null, start?.rest ?? null, start?.imported ?? 0)
      .run();
  }
  const reader = await findReader(db, id);
  return reader ? json({ ok: true, me: await me(db, reader, today) }) : fail('error', 500);
}

/** POST /api/leaderboard/checkin {secret}: o leitor completou hoje as três leituras. */
export async function postCheckin(request: Request, env: Env, now = new Date()): Promise<Response> {
  const db = env.LEADERBOARD_DB;
  if (!db) return fail('unavailable', 503);
  if (!sameOrigin(request)) return fail('forbidden', 403);
  const body = await readBody(request);
  if (!body || !validSecret(body.secret)) return fail('bad-request', 400);
  const id = await readerId(body.secret);
  const reader = await findReader(db, id);
  if (!reader) return fail('not-joined', 404);
  // A data é sempre a do servidor: não se aceitam dias passados nem futuros.
  const today = lisbonDate(now);
  const before = toState(reader);
  const next = applyCheckin(before, today);
  const imported = keepImported(before, next, reader.imported);
  await db.batch([
    db.prepare('INSERT OR IGNORE INTO checkins (reader_id, day) VALUES (?1, ?2)').bind(id, today),
    db
      .prepare('UPDATE readers SET streak = ?2, best = ?3, last_day = ?4, rest_day = ?5, imported = ?6 WHERE id = ?1')
      .bind(id, next.streak, next.best, next.last ?? null, next.rest ?? null, imported),
  ]);
  const updated = await findReader(db, id);
  return updated ? json({ ok: true, me: await me(db, updated, today) }) : fail('error', 500);
}

/** POST /api/leaderboard/me {secret}: a posição do próprio leitor (sem pôr a chave no endereço). */
export async function postMe(request: Request, env: Env, now = new Date()): Promise<Response> {
  const db = env.LEADERBOARD_DB;
  if (!db) return fail('unavailable', 503);
  if (!sameOrigin(request)) return fail('forbidden', 403);
  const body = await readBody(request);
  if (!body || !validSecret(body.secret)) return fail('bad-request', 400);
  const reader = await findReader(db, await readerId(body.secret));
  if (!reader) return fail('not-joined', 404);
  return json({ ok: true, me: await me(db, reader, lisbonDate(now)) });
}

/** POST /api/leaderboard/leave {secret}: sai e apaga o nome e os dias. */
export async function postLeave(request: Request, env: Env): Promise<Response> {
  const db = env.LEADERBOARD_DB;
  if (!db) return fail('unavailable', 503);
  if (!sameOrigin(request)) return fail('forbidden', 403);
  const body = await readBody(request);
  if (!body || !validSecret(body.secret)) return fail('bad-request', 400);
  const id = await readerId(body.secret);
  await db.batch([
    db.prepare('DELETE FROM checkins WHERE reader_id = ?1').bind(id),
    db.prepare('DELETE FROM readers WHERE id = ?1').bind(id),
  ]);
  return json({ ok: true });
}
