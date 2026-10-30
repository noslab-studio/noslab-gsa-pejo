/**
 * Conservazione dei contatti come promette la privacy: le richieste dal modulo
 * contatti senza attività da più di 24 mesi vengono cancellate dall'archivio
 * Blobs «lead». Gli iscritti alla newsletter restano finché non chiedono la
 * cancellazione (si tolgono a mano dalla pagina privata). Non invia nulla.
 */
import { getStore } from '@netlify/blobs';

export const config = {
  // Ogni lunedì alle 04:00 UTC.
  schedule: '0 4 * * 1',
};

const MESI = 24;

// Ultima attività: la creazione o l'ultima voce dello storico (cambi di stato).
const ultimaAttivita = (lead) =>
  [lead.creato, ...(lead.storico || []).map((s) => s.data)].filter(Boolean).sort().pop() || '';

export default async () => {
  const elenco = getStore('lead');
  const limite = new Date();
  limite.setMonth(limite.getMonth() - MESI);
  const soglia = limite.toISOString();

  const { blobs } = await elenco.list();
  let cancellati = 0;
  for (const { key } of blobs) {
    const lead = await elenco.get(key, { type: 'json' }).catch(() => null);
    if (!lead || lead.fonte === 'newsletter') continue;
    const ultima = ultimaAttivita(lead);
    if (ultima && ultima < soglia) {
      await elenco.delete(key);
      cancellati++;
    }
  }
  console.log(`Pulizia contatti: cancellati ${cancellati} su ${blobs.length}.`);
  return new Response('ok', { status: 200 });
};
