// Definições do site lidas no build (variáveis de ambiente do Cloudflare Pages).
// Uma variável vazia conta como não definida. Sem ID de publisher, não há anúncios nem scripts do Google.

const env = (name: string) => process.env[name]?.trim() || undefined;

/** ID de publisher do AdSense, por exemplo "ca-pub-1234567890123456". */
export const ADSENSE_CLIENT = env('BRADBURY_ADSENSE_CLIENT');

/** IDs dos espaços de anúncio, criados no AdSense. Cada espaço sem ID não aparece. */
export const AD_SLOTS = {
  dayMiddle: env('BRADBURY_AD_SLOT_DAY_MIDDLE'),
  dayEnd: env('BRADBURY_AD_SLOT_DAY_END'),
  archive: env('BRADBURY_AD_SLOT_ARCHIVE'),
} as const;

export type AdSlotName = keyof typeof AD_SLOTS;

export const adsEnabled = () => !!ADSENSE_CLIENT;

/** Token do Cloudflare Web Analytics (sem cookies). Opcional. */
export const CF_ANALYTICS_TOKEN = env('BRADBURY_CF_ANALYTICS_TOKEN');

/** Endereço de contacto mostrado no site. */
export const CONTACT_EMAIL = env('BRADBURY_CONTACT_EMAIL') ?? 'contact@bradburychallenge.org';

/** Nome de quem gere o site (responsável pelo tratamento de dados, RGPD). */
export const OPERATOR_NAME = env('BRADBURY_OPERATOR_NAME');

/** "pub-1234567890123456", a forma usada no ads.txt. */
export const adsTxtPublisherId = () => ADSENSE_CLIENT?.replace(/^ca-/, '');
