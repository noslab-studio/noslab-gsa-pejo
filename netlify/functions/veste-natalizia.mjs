/**
 * Accende e spegne la veste natalizia senza deploy a mano.
 *
 * Il sito è statico: neve e albero entrano nell'HTML solo se la build cade nel
 * periodo delle feste (src/lib/natale.mjs). Ogni notte questa funzione
 * confronta lo stato atteso con quello della home pubblicata e, se non
 * combaciano, lancia una nuova build con BUILD_HOOK_URL. In pratica parte il
 * 1° dicembre e il 7 gennaio; se una build salta, ci riprova la notte dopo.
 *
 * Le funzioni schedulate girano solo sul deploy di produzione.
 * Variabili: BUILD_HOOK_URL (già usata per le recensioni), VESTE_NATALIZIA
 * (facoltativa; se impostata su Netlify deve valere anche per le Functions,
 * altrimenti qui lo stato atteso sarebbe diverso da quello della build).
 */
import { SEGNO_VESTE, vesteNataliziaAccesa } from '../../src/lib/natale.mjs';

export const config = {
  // Ogni notte alle 23:05 UTC, cioè alle 00:05 in Italia d'inverno: il giorno
  // nuovo è appena iniziato, quindi la build parte nei primi minuti.
  schedule: '5 23 * * *',
};

export default async () => {
  const attesa = vesteNataliziaAccesa(process.env);
  const sito = process.env.URL || 'https://gsa-pejo.com';

  let pubblicata;
  try {
    const res = await fetch(new URL('/', sito));
    if (!res.ok) throw new Error(`la home risponde ${res.status}`);
    pubblicata = (await res.text()).includes(SEGNO_VESTE);
  } catch (e) {
    console.error('Veste natalizia: impossibile leggere la home pubblicata:', e);
    return new Response('errore', { status: 500 });
  }

  if (attesa === pubblicata) {
    console.log(`Veste natalizia ${attesa ? 'accesa' : 'spenta'} come previsto: nessuna build.`);
    return new Response('allineata', { status: 200 });
  }

  const gancio = process.env.BUILD_HOOK_URL;
  if (!gancio) {
    console.error('Veste natalizia da aggiornare, ma BUILD_HOOK_URL non è configurato.');
    return new Response('gancio assente', { status: 500 });
  }

  try {
    const res = await fetch(gancio, { method: 'POST' });
    if (!res.ok) throw new Error(`il build hook risponde ${res.status}`);
    console.log(`Veste natalizia da ${attesa ? 'accendere' : 'spegnere'}: build avviata.`);
    return new Response('build avviata', { status: 200 });
  } catch (e) {
    console.error('Veste natalizia: build non avviata:', e);
    return new Response('errore', { status: 500 });
  }
};
