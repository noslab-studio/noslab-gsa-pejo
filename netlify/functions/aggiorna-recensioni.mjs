/**
 * Ricostruzione settimanale del sito, così le recensioni Google della sezione
 * "Dicono di me" restano aggiornate: vengono lette a ogni build dalla Places API.
 *
 * Parte solo se la chiave Google è configurata, altrimenti non fa nulla
 * (niente build inutili). Variabili: GOOGLE_PLACES_API_KEY, BUILD_HOOK_URL.
 */
export const config = {
  // Ogni lunedì alle 05:30 UTC, prima che inizi la settimana lavorativa.
  schedule: '30 5 * * 1',
};

export default async () => {
  const chiave = process.env.GOOGLE_PLACES_API_KEY;
  const gancio = process.env.BUILD_HOOK_URL;

  if (!chiave) {
    console.log('Chiave Google Places non configurata: nessuna ricostruzione.');
    return new Response('chiave assente', { status: 200 });
  }
  if (!gancio) {
    console.log('BUILD_HOOK_URL non configurato: impossibile avviare la ricostruzione.');
    return new Response('gancio assente', { status: 200 });
  }

  try {
    const res = await fetch(gancio, { method: 'POST' });
    console.log(
      res.ok
        ? 'Ricostruzione avviata per aggiornare le recensioni.'
        : `Ricostruzione non avviata: ${res.status}`,
    );
    return new Response(res.ok ? 'avviata' : 'non avviata', { status: 200 });
  } catch (e) {
    console.error('Errore avvio ricostruzione:', e);
    return new Response('errore', { status: 500 });
  }
};
