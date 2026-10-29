import { getStore } from '@netlify/blobs';

/**
 * Salva ogni contatto ricevuto dai moduli in un elenco leggero (archivio Netlify),
 * consultabile dalla pagina privata /api/contatti.
 * L'email immediata a Simona continua ad arrivare dai Netlify Forms.
 *
 * Chi si iscrive alla newsletter NON è un contatto da richiamare: viene salvato
 * come iscritto, senza data di ricontatto, così non finisce tra le cose da fare.
 *
 * Viene chiamata dal webhook Netlify "submission_created".
 * Variabile richiesta: LEAD_WEBHOOK_TOKEN
 */
export const config = { path: '/api/lead-ingest' };

const risposta = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

/** Ricava i dati del contatto dal payload di Netlify, qualunque forma abbia. */
function estraiContatto(body) {
  const sub = body?.payload ?? body ?? {};
  const dati = sub.data ?? sub.human_fields ?? {};
  const form = String(sub.form_name || sub.formName || 'contatti').toLowerCase();

  const val = (...chiavi) => {
    for (const k of chiavi) {
      const v = dati[k] ?? dati[k.charAt(0).toUpperCase() + k.slice(1)];
      if (typeof v === 'string' && v.trim()) return v.trim().slice(0, 2000);
    }
    return null;
  };

  return {
    fonte: form.includes('newsletter') ? 'newsletter' : 'contatti',
    nome: val('nome', 'name'),
    email: val('email'),
    telefono: val('telefono', 'phone', 'tel'),
    messaggio: val('messaggio', 'message'),
  };
}

/** Data di oggi (fuso italiano) in formato AAAA-MM-GG. */
export const oggiISO = (giorniDopo = 0) => {
  const d = new Date(Date.now() + giorniDopo * 86400000);
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(d);
};

export default async (req) => {
  if (req.method !== 'POST') return risposta({ error: 'Metodo non consentito' }, 405);

  // Endpoint pubblico: si autentica con un token nella query string.
  const atteso = process.env.LEAD_WEBHOOK_TOKEN;
  const ricevuto = new URL(req.url).searchParams.get('token');
  if (!atteso || ricevuto !== atteso) return risposta({ error: 'Non autorizzato' }, 401);

  let body;
  try {
    body = await req.json();
  } catch {
    return risposta({ error: 'Dati non validi' }, 400);
  }

  const c = estraiContatto(body);
  if (!c.email && !c.telefono) return risposta({ error: 'Contatto senza recapiti' }, 422);

  const iscrizione = c.fonte === 'newsletter';

  const lead = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    creato: new Date().toISOString(),
    ...c,
    // iscritto = solo newsletter; gli altri: nuovo | contattato | in_trattativa | cliente | perso
    stato: iscrizione ? 'iscritto' : 'nuovo',
    // Un'iscrizione alla newsletter non si richiama: niente data di ricontatto.
    prossimoFollowUp: iscrizione ? null : oggiISO(2),
    note: '',
    storico: [
      {
        data: new Date().toISOString(),
        tipo: 'arrivato',
        note: iscrizione ? 'Iscrizione alla newsletter' : 'Richiesta dal modulo contatti',
      },
    ],
  };

  try {
    const elenco = getStore('lead');
    await elenco.setJSON(lead.id, lead);
    return risposta({ ok: true, id: lead.id });
  } catch (e) {
    console.error('Salvataggio lead non riuscito:', e);
    return risposta({ error: 'Errore interno' }, 500);
  }
};
