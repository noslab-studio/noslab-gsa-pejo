import { getStore } from '@netlify/blobs';

/**
 * Promemoria di ricontatto: ogni mattina controlla l'elenco dei contatti e,
 * se ce n'è qualcuno da richiamare, manda il riepilogo alla mail di Simona.
 * Se non c'è nulla in scadenza non invia niente (zero rumore).
 *
 * L'email passa dai Netlify Forms (modulo "promemoria"), che inoltrano già
 * a gsa.gestione@gmail.com: nessun servizio esterno, nessun costo.
 */
export const config = {
  // Ogni giorno alle 07:00 UTC (le 9 in Italia d'estate).
  schedule: '0 7 * * *',
};

const SITE = process.env.SITE_URL || 'https://gsa-pejo.com';

const dataIt = (iso) => new Date(iso).toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });

const oggiISO = (giorniDopo = 0) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(
    new Date(Date.now() + giorniDopo * 86400000),
  );

const APERTI = ['nuovo', 'contattato', 'in_trattativa'];

/** Testo del promemoria, leggibile anche dal telefono. */
function componiTesto(leads) {
  const righe = leads.map((l, i) => {
    const chi = l.nome || l.email || l.telefono || 'contatto senza nome';
    const recapiti = [l.email, l.telefono].filter(Boolean).join(' · ');
    const msg = l.messaggio ? `\n   "${String(l.messaggio).slice(0, 200)}"` : '';
    return `${i + 1}. ${chi}\n   ${recapiti}\n   arrivato il ${dataIt(l.creato)} · stato: ${l.stato} · da: ${l.fonte}${msg}`;
  });

  return [
    `Ciao Simona, ecco chi conviene ricontattare oggi (${dataIt(new Date().toISOString())}).`,
    '',
    ...righe,
    '',
    'Se hai già sentito qualcuno, va bene così: il promemoria tornerà fra qualche giorno.',
    'Messaggio automatico del sito gsa-pejo.com',
  ].join('\n');
}

export default async () => {
  let elenco;
  try {
    elenco = getStore('lead');
  } catch (e) {
    console.error('Archivio non disponibile:', e);
    return new Response('archivio non disponibile', { status: 200 });
  }

  try {
    const { blobs } = await elenco.list();
    const tutti = await Promise.all(
      blobs.map((b) => elenco.get(b.key, { type: 'json' }).catch(() => null)),
    );

    const oggi = oggiISO();
    const daRicontattare = tutti
      .filter((l) => l && APERTI.includes(l.stato))
      .filter((l) => l.prossimoFollowUp && l.prossimoFollowUp <= oggi)
      .sort((a, b) => String(a.prossimoFollowUp).localeCompare(String(b.prossimoFollowUp)))
      .slice(0, 25);

    if (!daRicontattare.length) {
      console.log('Nessun contatto da richiamare oggi.');
      return new Response('nessun contatto in scadenza', { status: 200 });
    }

    // Invio tramite il modulo "promemoria": Netlify lo inoltra per email.
    const quanti = daRicontattare.length;
    const invio = await fetch(`${SITE}/`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'form-name': 'promemoria',
        oggetto: `Da ricontattare: ${quanti} ${quanti === 1 ? 'contatto' : 'contatti'}`,
        dettagli: componiTesto(daRicontattare),
      }),
    });

    if (!invio.ok) {
      console.error('Invio promemoria fallito:', invio.status);
      return new Response('invio fallito', { status: 200 });
    }

    // Sposta il prossimo controllo di 3 giorni e annota il promemoria.
    const fra3 = oggiISO(3);
    await Promise.all(
      daRicontattare.map((l) =>
        elenco
          .setJSON(l.id, {
            ...l,
            prossimoFollowUp: fra3,
            storico: [
              ...(l.storico || []),
              {
                data: new Date().toISOString(),
                tipo: 'promemoria',
                note: `Segnalato a Simona; prossimo controllo il ${fra3}.`,
              },
            ],
          })
          .catch(() => {}),
      ),
    );

    console.log(`Promemoria inviato per ${quanti} contatti.`);
    return new Response(`promemoria inviato: ${quanti}`, { status: 200 });
  } catch (e) {
    console.error('Errore promemoria:', e);
    return new Response('errore', { status: 500 });
  }
};
