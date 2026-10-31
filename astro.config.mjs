// @ts-check
import { execFileSync } from 'node:child_process';
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Pagine noindex (ringraziamenti e pagine legali): fuori dalla sitemap.
const FUORI_SITEMAP = [
  '/grazie/',
  '/iscrizione-confermata/',
  '/privacy/',
  '/cookie-policy/',
  '/termini/',
  '/liberatoria/',
];

/**
 * Data dell'ultima modifica vera di una pagina, per il <lastmod> della sitemap.
 * Prima era `new Date()`: ogni build, compresa quella settimanale delle
 * recensioni, dichiarava tutte le pagine «modificate oggi», e Google impara a
 * ignorare un lastmod che non dice il vero.
 *
 * @param {string} percorso pathname della pagina, es. '/' o '/servizi/'
 * @returns {string | undefined} data ISO 8601, oppure undefined per non
 *   scrivere il lastmod di quella pagina
 */
function dataModifica(percorso) {
  // La data dell'ultimo commit che ha toccato i sorgenti della pagina: la
  // build settimanale delle recensioni non crea commit, quindi non la sposta.
  const pagina = percorso === '/' ? 'index' : percorso.replace(/^\/|\/$/g, '');
  const sorgenti = [`src/pages/${pagina}.astro`];
  // La pagina servizi mostra anche le schede della collection.
  if (pagina === 'servizi') sorgenti.push('src/content/services');
  try {
    const data = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...sorgenti], {
      encoding: 'utf8',
    }).trim();
    return data || undefined;
  } catch {
    // Senza git (o senza storia) meglio nessun lastmod che uno falso.
    return undefined;
  }
}

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
      // Le pagine noindex restano fuori dalla sitemap.
      filter: (pagina) => !FUORI_SITEMAP.includes(new URL(pagina).pathname),
      changefreq: 'monthly',
      serialize(voce) {
        // Home e pagine commerciali contano più delle altre.
        const p = new URL(voce.url).pathname;
        if (p === '/') voce.priority = 1.0;
        else if (['/servizi/', '/fotografia/', '/contatti/'].includes(p)) voce.priority = 0.9;
        else if (p === '/chi-sono/') voce.priority = 0.8;
        else voce.priority = 0.5;
        const data = dataModifica(p);
        if (data) voce.lastmod = data;
        return voce;
      },
    }),
  ],
});
