// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Usado nos URLs absolutos (canonical, sitemap, Open Graph). O domínio definitivo é o valor por
  // omissão, para um build de produção nunca apontar para outro sítio por esquecimento.
  site: process.env.BRADBURY_SITE_URL || 'https://bradburychallenge.org',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
