import type { APIRoute } from 'astro';
import { adsTxtPublisherId } from '../site/settings.js';

// ads.txt (IAB): declara quem está autorizado a vender anúncios neste domínio.
// Gerado a partir de BRADBURY_ADSENSE_CLIENT; sem ID, fica um ficheiro válido sem vendedores.
// f08c47fec0942fa0 é o identificador da Google na TAG (Trustworthy Accountability Group).
export const GET: APIRoute = () => {
  const pub = adsTxtPublisherId();
  const body = pub
    ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
    : '# No advertising systems are authorised for this site yet.\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
