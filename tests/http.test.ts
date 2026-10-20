import { describe, expect, it } from 'vitest';
import { PoliteClient, RobotsDisallowedError } from '../src/lib/http.js';

function fakeFetch(robots: string | number, log: { url: string; at: number }[] = []) {
  return (async (input: string | URL | Request) => {
    const url = String(input);
    log.push({ url, at: Date.now() });
    if (url.endsWith('/robots.txt')) {
      return typeof robots === 'number' ? new Response('', { status: robots }) : new Response(robots);
    }
    return new Response('ok');
  }) as typeof fetch;
}

describe('PoliteClient', () => {
  it('recusa URLs proibidos pelo robots.txt', async () => {
    const c = new PoliteClient('TestBot', 0, fakeFetch('User-agent: *\nDisallow: /search'));
    await expect(c.text('https://e.example/search?q=x')).rejects.toBeInstanceOf(RobotsDisallowedError);
    await expect(c.text('https://e.example/poems')).resolves.toBe('ok');
  });

  it('trata robots.txt inacessível (403) como proibição total', async () => {
    const c = new PoliteClient('TestBot', 0, fakeFetch(403));
    await expect(c.text('https://e.example/a')).rejects.toBeInstanceOf(RobotsDisallowedError);
  });

  it('sem robots.txt (404), permite', async () => {
    const c = new PoliteClient('TestBot', 0, fakeFetch(404));
    await expect(c.text('https://e.example/a')).resolves.toBe('ok');
  });

  it('respeita o crawl-delay mesmo com pedidos simultâneos', async () => {
    const log: { url: string; at: number }[] = [];
    const c = new PoliteClient('TestBot', 0, fakeFetch('User-agent: *\nCrawl-delay: 0.2\nAllow: /', log));
    await Promise.all([c.text('https://e.example/1'), c.text('https://e.example/2'), c.text('https://e.example/3')]);
    const times = log.filter((l) => !l.url.endsWith('robots.txt')).map((l) => l.at);
    expect(log.filter((l) => l.url.endsWith('robots.txt'))).toHaveLength(1);
    expect(times[2]! - times[0]!).toBeGreaterThanOrEqual(380);
  });
});
