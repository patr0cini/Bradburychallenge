import type { APIRoute } from 'astro';
import { siteImage } from '../../site/og-image.js';

// /og/site.png: imagem de partilha das páginas que não são de um dia.
export const GET: APIRoute = () => new Response(new Uint8Array(siteImage()), { headers: { 'Content-Type': 'image/png' } });
