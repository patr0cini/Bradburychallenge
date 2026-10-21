import type { APIRoute, GetStaticPaths } from 'astro';
import { loadSiteData, type SiteDay } from '../../site/data.js';
import { dayImage } from '../../site/og-image.js';

// /og/2026-10-21.png: imagem de partilha de cada dia.
export const getStaticPaths: GetStaticPaths = () => loadSiteData().days.map((day) => ({ params: { date: day.date }, props: { day } }));

export const GET: APIRoute = ({ props }) =>
  new Response(new Uint8Array(dayImage((props as { day: SiteDay }).day)), { headers: { 'Content-Type': 'image/png' } });
