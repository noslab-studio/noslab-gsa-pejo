/**
 * Veste natalizia del sito (neve che scende, albero dorato con gli auguri).
 *
 * È l'unico posto in cui si decide se la veste è accesa. La usano:
 * - i componenti `Neve.astro` e `AlberoAuguri.astro`, a build-time;
 * - la funzione schedulata `netlify/functions/veste-natalizia.mjs`, che ogni
 *   notte confronta lo stato atteso con quello pubblicato e, se non
 *   combaciano, lancia una nuova build (così si accende e si spegne da sola,
 *   senza deploy a mano).
 *
 * Regole:
 * 1. `VESTE_NATALIZIA=accesa` (oppure `on`) la forza accesa, `spenta` (oppure
 *    `off`) la forza spenta. Serve per le prove in locale
 *    (`VESTE_NATALIZIA=accesa npm run dev`) o per spegnerla prima del tempo.
 * 2. Altrimenti decide la data, sull'ora italiana: accesa dal 1° dicembre al
 *    6 gennaio compresi.
 * 3. Nei deploy preview e nei branch deploy di Netlify si accende già dal
 *    1° novembre, così le modifiche si controllano prima che vadano online.
 *
 * File JavaScript (non TypeScript) perché lo importa anche la funzione Netlify.
 */

/** Periodo della veste in produzione, come mese*100+giorno (estremi compresi). */
export const PERIODO = { inizio: 1201, fine: 106 };

/** Nelle anteprime di Netlify la veste parte prima: dal 1° novembre. */
export const INIZIO_ANTEPRIME = 1101;

/**
 * Attributo HTML presente solo quando la veste è accesa. La funzione
 * schedulata lo cerca nella home pubblicata per sapere lo stato attuale.
 */
export const SEGNO_VESTE = 'data-veste-natalizia';

const FUSO = 'Europe/Rome';

/**
 * Mese e giorno di una data sull'ora italiana, nel formato mese*100+giorno
 * (es. 1201 per il 1° dicembre). Le build di Netlify girano in UTC: senza il
 * fuso la veste si accenderebbe con un'ora di ritardo.
 *
 * @param {Date} data
 * @returns {number}
 */
export function meseGiorno(data) {
  const parti = new Intl.DateTimeFormat('it-IT', {
    timeZone: FUSO,
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(data);
  const valore = (/** @type {string} */ tipo) =>
    Number(parti.find((p) => p.type === tipo)?.value ?? 0);
  return valore('month') * 100 + valore('day');
}

/**
 * Vero se `md` cade fra `inizio` e `fine` compresi, anche a cavallo d'anno
 * (es. dal 1201 al 106).
 *
 * @param {number} md
 * @param {number} inizio
 * @param {number} fine
 * @returns {boolean}
 */
function nelPeriodo(md, inizio, fine) {
  return inizio <= fine ? md >= inizio && md <= fine : md >= inizio || md <= fine;
}

/**
 * Decide se la veste natalizia è accesa.
 *
 * @param {Record<string, string | undefined>} env variabili d'ambiente
 *   (`process.env`): legge `VESTE_NATALIZIA` e `CONTEXT` (impostata da Netlify)
 * @param {Date} [data] momento da valutare, di default adesso
 * @returns {boolean}
 */
export function vesteNataliziaAccesa(env, data = new Date()) {
  const forzata = (env.VESTE_NATALIZIA ?? '').trim().toLowerCase();
  if (forzata === 'accesa' || forzata === 'on') return true;
  if (forzata === 'spenta' || forzata === 'off') return false;

  const anteprima = env.CONTEXT === 'deploy-preview' || env.CONTEXT === 'branch-deploy';
  const inizio = anteprima ? INIZIO_ANTEPRIME : PERIODO.inizio;
  return nelPeriodo(meseGiorno(data), inizio, PERIODO.fine);
}
