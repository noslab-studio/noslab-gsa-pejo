// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // URL di produzione: usato per canonical, Open Graph e sitemap. Allineato a SITE_URL.
  site: 'https://gsa-pejo.com',
  // La compressione toglieva lo spazio fra una riga di testo e il link o il
  // grassetto che va a capo (Prettier li spezza così): uscivano parole
  // incollate come «nellaCookie Policy». Netlify comprime comunque con gzip/brotli.
  compressHTML: false,

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    sitemap({
      // La pagina di ringraziamento è noindex: fuori dalla sitemap.
      filter: (pagina) => !pagina.includes('/grazie'),
      changefreq: 'monthly',
      lastmod: new Date(),
      serialize(voce) {
        // Home e pagine commerciali contano più delle pagine legali.
        const p = new URL(voce.url).pathname;
        if (p === '/') voce.priority = 1.0;
        else if (['/servizi/', '/fotografia/', '/contatti/'].includes(p)) voce.priority = 0.9;
        else if (p === '/chi-sono/') voce.priority = 0.8;
        else voce.priority = 0.3; // privacy, cookie, liberatoria, note legali
        return voce;
      },
    }),
  ],
});
