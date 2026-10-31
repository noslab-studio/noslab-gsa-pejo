/**
 * Pulizia quotidiana dell'archivio anti-abuso della chat (store Blobs
 * "chat-limiti"): cancella le impronte degli IP dei giorni precedenti a ieri,
 * così la privacy può promettere una conservazione di al massimo 48 ore anche
 * nei giorni in cui la chat non viene usata. Le chiavi «mese» del tetto
 * mensile (senza impronta) restano fino alla fine del mese. Non invia nulla
 * a nessuno.
 */
import { getStore } from '@netlify/blobs';

export const config = {
  // Ogni giorno alle 03:15 UTC.
  schedule: '15 3 * * *',
};

export default async () => {
  const store = getStore({ name: 'chat-limiti', consistency: 'strong' });
  const ieri = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const meseCorrente = new Date().toISOString().slice(0, 7);
  const { blobs } = await store.list();
  // Le chiavi «mese/AAAA-MM/...» si tengono per tutto il mese; tutte le altre
  // iniziano con la data (AAAA-MM-GG), anche quelle dei formati precedenti.
  const vecchie = blobs.filter((b) =>
    b.key.startsWith('mese/') ? b.key.slice(5, 12) < meseCorrente : b.key.slice(0, 10) < ieri,
  );
  await Promise.all(vecchie.map((b) => store.delete(b.key)));
  console.log(`Pulizia chat: cancellate ${vecchie.length} chiavi su ${blobs.length}.`);
  return new Response('ok', { status: 200 });
};
