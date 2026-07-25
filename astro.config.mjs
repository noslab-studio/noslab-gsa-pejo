// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // URL di produzione: usato per canonical, Open Graph e sitemap. Allineato a SITE_URL.
  site: 'https://gsa-pejo.com',

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap()],
});
