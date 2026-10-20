// Configuração central do Bradbury Challenge.
// Valores sensíveis (chaves, tokens) nunca ficam aqui: vêm de variáveis de ambiente.
// Uma variável vazia conta como não definida (no GitHub Actions, uma variável de repositório
// que não existe chega como texto vazio).

export const SITE_NAME = 'Bradbury Challenge';

/** Primeiro dia de leituras (data ISO, fuso Europe/Lisbon). A definir pelo dono do projeto. */
export const START_DATE = process.env.BRADBURY_START_DATE || '2026-11-01';

/** Seed da ordem pseudo-aleatória da seleção diária. Não mudar depois do lançamento. */
export const SELECTION_SEED = process.env.BRADBURY_SEED || 'bradbury';

export const TIME_ZONE = 'Europe/Lisbon';

/** Página de contacto incluída no User-Agent, para os sites saberem quem somos. Definir quando houver domínio. */
export const CONTACT_URL = process.env.BRADBURY_CONTACT_URL || '';

export const USER_AGENT =
  'BradburyChallengeBot/0.1 (' +
  (CONTACT_URL ? `+${CONTACT_URL}; ` : '') +
  'daily reading list; stores only title, author and link)';

/** Intervalo mínimo entre pedidos ao mesmo site, quando o robots.txt não define crawl-delay. */
export const DEFAULT_CRAWL_DELAY_MS = 3000;

/** Cada fonte é atualizada no máximo uma vez a cada N dias. */
export const SOURCE_REFRESH_DAYS = 7;

/** Um texto usado não volta a aparecer antes de passarem N dias. */
export const REUSE_MIN_DAYS = 365;
