/**
 * Pulizia quotidiana dell'archivio anti-abuso della chat (store Blobs
 * "chat-limiti"): cancella le impronte degli IP dei giorni prima di oggi. I
 * limiti contano solo le chiavi di oggi, e così un'impronta resta al massimo
 * 27 ore (scritta alle 00:00 UTC, cancellata il giorno dopo alle 03:15), sotto
 * le 48 promesse dalla privacy, anche nei giorni in cui la chat non viene
 * usata. Prima si teneva anche ieri e si arrivava a 51 ore. Le chiavi «mese»
 * del tetto mensile (senza impronta) restano fino alla fine del mese. Non
 * invia nulla a nessuno.
 */
import { getStore } from '@netlify/blobs';

export const config = {
  // Ogni giorno alle 03:15 UTC.
  schedule: '15 3 * * *',
};

export default async () => {
  const store = getStore({ name: 'chat-limiti', consistency: 'strong' });
  const oggi = new Date().toISOString().slice(0, 10);
  const meseCorrente = new Date().toISOString().slice(0, 7);
  const { blobs } = await store.list();
  // Le chiavi «mese/AAAA-MM/...» si tengono per tutto il mese; tutte le altre
  // iniziano con la data (AAAA-MM-GG), anche quelle dei formati precedenti.
  const vecchie = blobs.filter((b) =>
    b.key.startsWith('mese/') ? b.key.slice(5, 12) < meseCorrente : b.key.slice(0, 10) < oggi,
  );
  // A blocchi da 100: anche dopo giorni di abuso, con migliaia di chiavi, le
  // cancellazioni non partono tutte insieme e la funzione resta nei tempi.
  for (let i = 0; i < vecchie.length; i += 100) {
    await Promise.all(vecchie.slice(i, i + 100).map((b) => store.delete(b.key)));
  }
  console.log(`Pulizia chat: cancellate ${vecchie.length} chiavi su ${blobs.length}.`);
  return new Response('ok', { status: 200 });
};
