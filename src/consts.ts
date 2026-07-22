/**
 * Costanti globali del sito, usate da <BaseHead> e dallo structured data.
 * Modifica qui i valori canonici (titolo, descrizione, URL di produzione).
 */

/** URL di produzione (canonical). Deve combaciare con `site` in astro.config.mjs. */
export const SITE_URL = 'https://gsa-pejo.com';

export const SITE_TITLE = 'GSA Peio — Gruppo Sportivo Amatori Val di Pejo';
export const SITE_DESCRIPTION =
  'Gruppo Sportivo Amatori Peio: sci club in Val di Pejo. Corsi, gare, eventi e attività sulla neve per tutte le età.';

export const SITE_LANG = 'it';
export const SITE_LOCALE = 'it_IT';

/** Immagine di default per Open Graph / Twitter card (in /public/images/). */
export const DEFAULT_OG_IMAGE = '/images/og-default.jpg';
