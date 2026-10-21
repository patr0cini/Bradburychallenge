// Divulgação das leituras de hoje: publicação no Bluesky e no Mastodon e envio da newsletter
// (Buttondown). Cada canal só corre se as suas credenciais estiverem definidas (GitHub Secrets) e
// no máximo uma vez por dia: o último dia enviado fica em data/state/outreach.json.
//   npm run outreach              envia o que faltar de hoje
//   npm run outreach -- --dry-run mostra o que seria enviado, sem enviar nem gravar
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { DATA_DIR, readJson, writeJson } from '../src/lib/catalog.js';
import { log } from '../src/lib/log.js';
import { loadSiteData, type SiteDay } from '../src/site/data.js';
import { dayUrl, digestHtml, digestTitle, socialText } from '../src/site/digest.js';
import { dayImage } from '../src/site/og-image.js';
import { STRINGS as t } from '../src/site/strings.js';

const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean', default: false } } });
const DRY = values['dry-run'];

const env = (name: string) => process.env[name]?.trim() || undefined;
const STATE_FILE = join(DATA_DIR, 'state', 'outreach.json');
type Channel = 'bluesky' | 'mastodon' | 'newsletter';
const state = readJson<Partial<Record<Channel, string>>>(STATE_FILE, {});

const { days, today } = loadSiteData();
const day = days.at(-1);
if (!day || day.date !== today) {
  log('warn', 'outreach', `ainda não há leituras de ${today}; nada a enviar`);
  process.exit(0);
}

async function ok(res: Response, what: string) {
  if (!res.ok) throw new Error(`${what}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  return res;
}

// --- Bluesky (AT Protocol) -------------------------------------------------------------------

async function postBluesky(day: SiteDay) {
  const service = env('BLUESKY_SERVICE') ?? 'https://bsky.social';
  const text = socialText(day, 300);
  const url = dayUrl(day.date);
  if (DRY) return log('info', 'bluesky', `(dry-run)\n${text}`);

  const session = (await (
    await ok(
      await fetch(`${service}/xrpc/com.atproto.server.createSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: env('BLUESKY_HANDLE'), password: env('BLUESKY_APP_PASSWORD') }),
      }),
      'Bluesky, sessão',
    )
  ).json()) as { accessJwt: string; did: string };
  const auth = { Authorization: `Bearer ${session.accessJwt}` };

  const { blob } = (await (
    await ok(
      await fetch(`${service}/xrpc/com.atproto.repo.uploadBlob`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'image/png' },
        body: new Uint8Array(dayImage(day)),
      }),
      'Bluesky, imagem',
    )
  ).json()) as { blob: unknown };

  // A ligação no texto só é clicável com uma "facet", com posições em bytes UTF-8.
  const bytes = (s: string) => Buffer.byteLength(s, 'utf8');
  const start = bytes(text.slice(0, text.lastIndexOf(url)));
  const record = {
    $type: 'app.bsky.feed.post',
    text,
    createdAt: new Date().toISOString(),
    langs: ['en'],
    facets: [{ index: { byteStart: start, byteEnd: start + bytes(url) }, features: [{ $type: 'app.bsky.richtext.facet#link', uri: url }] }],
    embed: {
      $type: 'app.bsky.embed.external',
      external: { uri: url, title: digestTitle(day), description: t.tagline, thumb: blob },
    },
  };
  await ok(
    await fetch(`${service}/xrpc/com.atproto.repo.createRecord`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo: session.did, collection: 'app.bsky.feed.post', record }),
    }),
    'Bluesky, publicação',
  );
}

// --- Mastodon --------------------------------------------------------------------------------

async function postMastodon(day: SiteDay) {
  const text = socialText(day, 500);
  if (DRY) return log('info', 'mastodon', `(dry-run)\n${text}`);
  const instance = env('MASTODON_INSTANCE')!.replace(/\/+$/, '');
  await ok(
    await fetch(`${instance}/api/v1/statuses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env('MASTODON_TOKEN')}`,
        'Content-Type': 'application/json',
        // O Mastodon ignora pedidos repetidos com a mesma chave durante uma hora.
        'Idempotency-Key': `bradbury-${day.date}`,
      },
      body: JSON.stringify({ status: text, visibility: 'public', language: 'en' }),
    }),
    'Mastodon, publicação',
  );
}

// --- Newsletter (Buttondown) -----------------------------------------------------------------

async function sendNewsletter(day: SiteDay) {
  const titles = day.readings.map((r) => r.title);
  const subject = `Today: ${titles.slice(0, 2).join(', ')} and ${titles[2]}`;
  const body = `<p>Good morning. Here are today's three readings, all free to read in full.</p>
${digestHtml(day)}
<p>Happy reading.</p>`;
  if (DRY) return log('info', 'newsletter', `(dry-run) ${subject}\n${body}`);
  await ok(
    await fetch('https://api.buttondown.com/v1/emails', {
      method: 'POST',
      headers: {
        Authorization: `Token ${env('BUTTONDOWN_API_KEY')}`,
        'Content-Type': 'application/json',
        'X-API-Version': '2026-04-01',
        // Sem este cabeçalho, o primeiro envio por API de cada chave é recusado.
        'X-Buttondown-Live-Dangerously': 'true',
      },
      body: JSON.stringify({ subject, body, status: 'about_to_send' }),
    }),
    'Buttondown, envio',
  );
}

// --- Execução ----------------------------------------------------------------------------------

const channels: { name: Channel; enabled: boolean; run: (d: SiteDay) => Promise<void> }[] = [
  { name: 'bluesky', enabled: !!(env('BLUESKY_HANDLE') && env('BLUESKY_APP_PASSWORD')), run: postBluesky },
  { name: 'mastodon', enabled: !!(env('MASTODON_INSTANCE') && env('MASTODON_TOKEN')), run: postMastodon },
  { name: 'newsletter', enabled: !!env('BUTTONDOWN_API_KEY'), run: sendNewsletter },
];

let failures = 0;
for (const c of channels) {
  if (!c.enabled && !DRY) {
    log('info', c.name, 'sem credenciais; ignorado');
    continue;
  }
  if (state[c.name] === day.date && !DRY) {
    log('info', c.name, `${day.date} já enviado`);
    continue;
  }
  try {
    await c.run(day);
    if (!DRY) {
      state[c.name] = day.date;
      writeJson(STATE_FILE, state);
      log('info', c.name, `${day.date} enviado`);
    }
  } catch (err) {
    failures++;
    log('error', c.name, (err as Error).message);
  }
}
if (failures > 0) process.exit(1);
