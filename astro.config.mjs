// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Host pubblicato: usato per canonical, Open Graph, sitemap. Allineato a SITE_URL.
  // Temporaneo (dominio ancora su Canva): ripristinare 'https://gsa-pejo.com' al collegamento.
  site: 'https://noslab-gsa-pejo.netlify.app',

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap()],
});
