/**
 * Configurazione globale del sito — GSA di Grassi Simona Adele.
 * Fonte unica per branding, SEO, contatti e dati d'impresa (usati anche
 * dallo structured data). Modifica qui i valori canonici.
 */

/** URL di produzione (canonical). Deve combaciare con `site` in astro.config.mjs. */
export const SITE_URL = 'https://gsa-pejo.com';

export const SITE_NAME = 'GSA di Grassi Simona Adele';
export const SITE_TAGLINE = 'Consulente digitale e fotografia';
export const SITE_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const SITE_DESCRIPTION =
  'GSA di Grassi Simona Adele: consulenza pubblicitaria e social, servizi fotografici, ' +
  'gestione ufficio e fatturazione elettronica. In Val di Pejo (Trentino), per aziende e privati.';

export const SITE_LANG = 'it';
export const SITE_LOCALE = 'it_IT';

/** Immagine di default per Open Graph / Twitter card (in /public/images/). */
export const DEFAULT_OG_IMAGE = '/images/og-default.jpg';

/** Dati d'impresa e contatti (già pubblici sul sito attuale). */
export const BUSINESS = {
  /** Ragione sociale (impresa individuale). */
  legalName: 'GSA di Grassi Simona Adele',
  /** Titolare. */
  ownerName: 'Grassi Simona Adele',
  vatId: 'IT02609980228',
  email: 'gsa.gestione@gmail.com',
  phone: '+39 392 460 4341',
  /** Telefono in formato E.164 per link tel: e structured data. */
  phoneE164: '+393924604341',
  address: {
    street: 'Via San Giorgio, 15',
    postalCode: '38024',
    city: 'Peio',
    province: 'TN',
    region: 'Trentino-Alto Adige',
    country: 'IT',
  },
  areaServed: ['Val di Pejo', 'Trentino', 'Provincia di Brescia', 'Provincia di Bergamo'],
} as const;

/** Voci di navigazione principali. */
export const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Chi sono', href: '/chi-sono/' },
  { label: 'Servizi', href: '/servizi/' },
  { label: 'Fotografia', href: '/fotografia/' },
  { label: 'Contatti', href: '/contatti/' },
] as const;
