import type { APIRoute } from 'astro';

// robots.txt: tudo aberto (incluindo o robô do AdSense) e indicação do sitemap.
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
