// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Domínio definitivo a definir; usado nos URLs absolutos (sitemap, Open Graph).
  site: process.env.BRADBURY_SITE_URL || 'http://localhost:4321',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
