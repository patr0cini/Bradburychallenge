import robotsParser from 'robots-parser';
import { DEFAULT_CRAWL_DELAY_MS, USER_AGENT } from '../config.js';

type Robots = ReturnType<typeof robotsParser>;

export class RobotsDisallowedError extends Error {
  constructor(url: string) {
    super(`robots.txt não permite: ${url}`);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Cliente HTTP educado: lê o robots.txt de cada site antes do primeiro pedido,
 * respeita Disallow e crawl-delay, espaça os pedidos e identifica-se no User-Agent.
 */
export class PoliteClient {
  private robots = new Map<string, Promise<Robots | null>>();
  private nextAllowedAt = new Map<string, number>();

  constructor(
    private userAgent = USER_AGENT,
    private defaultDelayMs = DEFAULT_CRAWL_DELAY_MS,
    private fetchImpl: typeof fetch = fetch,
  ) {}

  private robotsFor(origin: string): Promise<Robots | null> {
    // Guarda a promessa, para pedidos simultâneos ao mesmo site lerem o robots.txt uma só vez.
    let p = this.robots.get(origin);
    if (!p) this.robots.set(origin, (p = this.loadRobots(origin)));
    return p;
  }

  private async loadRobots(origin: string): Promise<Robots | null> {
    const robotsUrl = `${origin}/robots.txt`;
    let parsed: Robots | null = null;
    try {
      const res = await this.fetchImpl(robotsUrl, { headers: { 'User-Agent': this.userAgent } });
      if (res.ok) parsed = robotsParser(robotsUrl, await res.text());
      else if (res.status >= 500 || res.status === 401 || res.status === 403) {
        // Sem acesso ao robots.txt: tratar como proibido, por precaução.
        parsed = robotsParser(robotsUrl, 'User-agent: *\nDisallow: /');
      }
      // 404: sem robots.txt, tudo permitido.
    } catch {
      parsed = robotsParser(robotsUrl, 'User-agent: *\nDisallow: /');
    }
    return parsed;
  }

  private async waitTurn(origin: string, robots: Robots | null) {
    const delaySec = robots?.getCrawlDelay(this.userAgent);
    const delay = Math.max(this.defaultDelayMs, (delaySec ?? 0) * 1000);
    // Reserva a vez antes de esperar, para pedidos simultâneos ficarem em fila.
    const now = Date.now();
    const at = Math.max(now, this.nextAllowedAt.get(origin) ?? now);
    this.nextAllowedAt.set(origin, at + delay);
    if (at > now) await sleep(at - now);
  }

  async get(url: string, accept = '*/*'): Promise<Response> {
    const { origin } = new URL(url);
    const robots = await this.robotsFor(origin);
    if (robots && robots.isAllowed(url, this.userAgent) === false) throw new RobotsDisallowedError(url);

    for (let attempt = 1; ; attempt++) {
      await this.waitTurn(origin, robots);
      const res = await this.fetchImpl(url, {
        headers: { 'User-Agent': this.userAgent, Accept: accept },
        signal: AbortSignal.timeout(30_000),
      }).catch((e: Error) => e);
      const retryable = res instanceof Error || res.status === 429 || res.status >= 500;
      if (!retryable) {
        if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
        return res;
      }
      if (attempt >= 3) throw res instanceof Error ? res : new Error(`HTTP ${res.status} em ${url}`);
      await sleep(attempt * 10_000);
    }
  }

  async text(url: string) {
    return (await this.get(url, 'text/html,application/xml;q=0.9,*/*;q=0.8')).text();
  }

  async json<T>(url: string): Promise<T> {
    return (await (await this.get(url, 'application/json')).json()) as T;
  }
}
