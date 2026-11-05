// Gera data/on-this-day.json: para cada dia do ano, até três escritores nascidos ou mortos nesse
// dia que tenham livros em inglês no Project Gutenberg. Corre-se à mão, raramente (os dados quase
// não mudam):
//   npm run on-this-day
// Fontes: Wikidata (CC0), pelo serviço SPARQL; catálogo do Gutenberg (pg_catalog.csv), que o
// próprio Gutenberg publica para este tipo de uso.
import { gunzipSync } from 'node:zlib';
import { writeJson } from '../src/lib/catalog.js';
import { log } from '../src/lib/log.js';
import {
  ON_THIS_DAY_FILE,
  cleanDescription,
  englishBookCount,
  englishBooksByLifespan,
  parseCsv,
  type LiteraryEvent,
  type OnThisDayFile,
} from '../src/site/on-this-day.js';

const USER_AGENT = 'BradburyChallenge/1.0 (https://bradburychallenge.org; contact@bradburychallenge.org)';
const PER_DAY = 3;
/** Mínimo de livros em inglês no Gutenberg para valer a pena a ligação. */
const MIN_BOOKS = 2;
const GREGORIAN = 'http://www.wikidata.org/entity/Q1985727';
// Escritor, poeta, romancista, ensaísta, contista, dramaturgo, autor para crianças.
const WRITER = 'Q36180';
const LITERARY = ['Q49757', 'Q6625963', 'Q11774202', 'Q15949613', 'Q214917', 'Q4853732'];

// O serviço SPARQL dá erros 5xx passageiros com alguma frequência: tenta-se até três vezes.
async function sparql(query: string, attempt = 1): Promise<Record<string, string>[]> {
  const res = await fetch('https://query.wikidata.org/sparql', {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/sparql-results+json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ query }),
  });
  if (res.status >= 500 && attempt < 3) {
    await new Promise((r) => setTimeout(r, attempt * 5000));
    return sparql(query, attempt + 1);
  }
  if (!res.ok) throw new Error(`Wikidata: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { results: { bindings: Record<string, { value: string }>[] } };
  return json.results.bindings.map((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])));
}

// --- 1. Escritores com página no Gutenberg, e as suas datas -----------------------------------

const rows = await sparql(`
SELECT ?p ?gut ?links ?dob ?dobp ?dobc ?dod ?dodp ?dodc
       (GROUP_CONCAT(DISTINCT STRAFTER(STR(?occ), "entity/"); separator=" ") AS ?occs) WHERE {
  VALUES ?occ { ${[WRITER, ...LITERARY].map((q) => `wd:${q}`).join(' ')} }
  ?p wdt:P106 ?occ; wdt:P1938 ?gut; wikibase:sitelinks ?links.
  # Só a data principal de cada pessoa (as alternativas e as desaprovadas ficam de fora).
  OPTIONAL { ?p p:P569 ?bs. ?bs a wikibase:BestRank; psv:P569 [wikibase:timeValue ?dob; wikibase:timePrecision ?dobp; wikibase:timeCalendarModel ?dobc] }
  OPTIONAL { ?p p:P570 ?ds. ?ds a wikibase:BestRank; psv:P570 [wikibase:timeValue ?dod; wikibase:timePrecision ?dodp; wikibase:timeCalendarModel ?dodc] }
} GROUP BY ?p ?gut ?links ?dob ?dobp ?dobc ?dod ?dodp ?dodc`);
log('info', 'on-this-day', `Wikidata: ${rows.length} linhas`);

interface Person {
  id: string;
  gut: string;
  links: number;
  literary: boolean;
  born?: { year: number; day?: string };
  died?: { year: number; day?: string };
}

/** Ano e, se a data for exata e gregoriana, o dia do ano ("11-05"). */
function parseDate(value?: string, precision?: string, calendar?: string) {
  const m = value?.match(/^(-?\d+)-(\d\d)-(\d\d)/);
  if (!m) return undefined;
  const exact = precision === '11' && calendar === GREGORIAN;
  return { year: Number(m[1]), day: exact ? `${m[2]}-${m[3]}` : undefined };
}

// Uma pessoa pode vir em várias linhas (datas alternativas): fica a primeira data exata.
const people = new Map<string, Person>();
for (const r of rows) {
  const id = r.p!.split('/').pop()!;
  const p = people.get(id) ?? { id, gut: r.gut!, links: Number(r.links), literary: false };
  p.literary ||= r.occs!.split(' ').some((o) => LITERARY.includes(o));
  for (const [key, d] of [
    ['born', parseDate(r.dob, r.dobp, r.dobc)],
    ['died', parseDate(r.dod, r.dodp, r.dodc)],
  ] as const) {
    if (d && (!p[key] || (!p[key].day && d.day))) p[key] = d;
  }
  people.set(id, p);
}

// --- 2. Livros em inglês no Gutenberg -----------------------------------------------------------

const gz = await fetch('https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv.gz', { headers: { 'User-Agent': USER_AGENT } });
if (!gz.ok) throw new Error(`Gutenberg: HTTP ${gz.status}`);
const books = englishBooksByLifespan(parseCsv(gunzipSync(Buffer.from(await gz.arrayBuffer())).toString('utf8')));
log('info', 'on-this-day', `Gutenberg: ${books.size} datas de vida com livros em inglês`);

// --- 3. Candidatos por dia (os nomes só se conhecem no passo 4) --------------------------------

// Mais ligações da Wikipédia = mais conhecido; os poetas, romancistas, etc. valem o triplo
// em relação a quem só tem "escritor" (jornalistas, políticos, cientistas que escreveram).
const score = (p: Person) => p.links * (p.literary ? 3 : 1);
const candidates = new Map<string, { person: Person; event: 'born' | 'died' }[]>();
for (const p of people.values()) {
  if (!p.born || !p.died || p.born.year < 1 || !books.has(`${p.born.year}-${p.died.year}`)) continue;
  for (const event of ['born', 'died'] as const) {
    const day = p[event]!.day;
    if (day) candidates.set(day, [...(candidates.get(day) ?? []), { person: p, event }]);
  }
}
// Os 15 mais conhecidos de cada dia chegam para escolher 3 depois de confirmar os livros.
const shortlist = new Set<string>();
for (const [day, list] of candidates) {
  list.sort((a, b) => score(b.person) - score(a.person));
  candidates.set(day, list.slice(0, 15));
  for (const c of list.slice(0, 15)) shortlist.add(c.person.id);
}

// --- 4. Nomes, descrições e artigo da Wikipédia em inglês --------------------------------------

const labels = new Map<string, { name: string; description?: string; wikipedia?: string }>();
const ids = [...shortlist];
for (let i = 0; i < ids.length; i += 250) {
  const batch = ids.slice(i, i + 250);
  const res = await sparql(`
SELECT ?p ?name ?description ?article WHERE {
  VALUES ?p { ${batch.map((id) => `wd:${id}`).join(' ')} }
  ?p rdfs:label ?name. FILTER(LANG(?name) = "en")
  OPTIONAL { ?p schema:description ?description. FILTER(LANG(?description) = "en") }
  OPTIONAL { ?article schema:about ?p; schema:isPartOf <https://en.wikipedia.org/> }
}`);
  for (const r of res) labels.set(r.p!.split('/').pop()!, { name: r.name!, description: r.description, wikipedia: r.article });
  log('info', 'on-this-day', `nomes: ${Math.min(i + 250, ids.length)} de ${ids.length}`);
}

// --- 5. Escolha final ---------------------------------------------------------------------------

const out: OnThisDayFile = {};
for (const [day, list] of [...candidates].sort(([a], [b]) => a.localeCompare(b))) {
  const chosen: LiteraryEvent[] = [];
  for (const { person: p, event } of list) {
    const l = labels.get(p.id);
    // Sem artigo na Wikipédia em inglês, ou com poucos livros em inglês, não serve a este site.
    if (!l?.wikipedia || englishBookCount(books, l.name, p.born!.year, p.died!.year) < MIN_BOOKS) continue;
    if (chosen.some((c) => c.name === l.name)) continue;
    const description = l.description ? cleanDescription(l.description) : undefined;
    chosen.push({
      event,
      year: p[event]!.year,
      name: l.name,
      ...(description ? { description } : {}),
      born: p.born!.year,
      died: p.died!.year,
      gutenberg: `https://www.gutenberg.org/ebooks/author/${p.gut}`,
      wikipedia: l.wikipedia,
    });
    if (chosen.length === PER_DAY) break;
  }
  if (chosen.length) out[day] = chosen;
}

writeJson(ON_THIS_DAY_FILE, out);
const days = Object.keys(out).length;
log('info', 'on-this-day', `${days} dias com escritores (${366 - days} sem nenhum)`);
