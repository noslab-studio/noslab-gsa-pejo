import { getStore } from '@netlify/blobs';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Pagina privata con l'elenco dei contatti ricevuti e i pulsanti per aggiornare
 * lo stato. Si apre da /api/contatti scrivendo la chiave di accesso.
 * Non è indicizzabile e non è linkata da nessuna parte del sito.
 */
export const config = { path: '/api/contatti' };

const STATI = ['nuovo', 'contattato', 'in_trattativa', 'cliente', 'perso'];
const APERTI = ['nuovo', 'contattato', 'in_trattativa'];

/**
 * Chi si è iscritto alla newsletter non è una persona da richiamare al telefono:
 * non compare mai tra le cose da fare, qualunque stato abbia in archivio
 * (vale anche per le iscrizioni salvate prima di questa correzione).
 */
const daRichiamare = (l, oggi) =>
  l.fonte !== 'newsletter' &&
  APERTI.includes(l.stato) &&
  Boolean(l.prossimoFollowUp) &&
  l.prossimoFollowUp <= oggi;

const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

const dataIt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' }) : '';

const oggiISO = (giorniDopo = 0) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(
    new Date(Date.now() + giorniDopo * 86400000),
  );

function pagina(leads) {
  const oggi = oggiISO();
  const iscritti = leads.filter((l) => l.fonte === 'newsletter');
  const aperti = leads.filter((l) => l.fonte !== 'newsletter' && APERTI.includes(l.stato));
  const daFare = leads.filter((l) => daRichiamare(l, oggi)).length;

  const righe =
    leads
      .map((l) => {
        const urgente = daRichiamare(l, oggi);
        const recapiti = [
          l.email ? `<a href="mailto:${esc(l.email)}">${esc(l.email)}</a>` : '',
          l.telefono ? `<a href="tel:${esc(l.telefono)}">${esc(l.telefono)}</a>` : '',
        ]
          .filter(Boolean)
          .join(' · ');

        const bottoni = STATI.filter((s) => s !== l.stato)
          .map((s) => `<button name="stato" value="${s}" class="b">${s.replace('_', ' ')}</button>`)
          .join('');

        const chi = l.nome || l.email || l.telefono || 'senza nome';

        return `<tr class="${urgente ? 'urgente' : ''}">
        <td>
          <strong>${esc(chi)}</strong>
          ${urgente ? '<span class="tag">da richiamare</span>' : ''}
          <div class="sm">${recapiti}</div>
          ${l.messaggio ? `<div class="msg">${esc(l.messaggio).slice(0, 300)}</div>` : ''}
        </td>
        <td class="sm">${esc(l.fonte)}<br />${dataIt(l.creato)}</td>
        <td class="sm"><strong>${esc(l.stato).replace('_', ' ')}</strong><br />ricontatto: ${esc(l.prossimoFollowUp || '-')}</td>
        <td>
          <form method="POST" class="azioni">
            <input type="hidden" name="id" value="${esc(l.id)}" />
            ${bottoni}
            <button name="elimina" value="1" class="b elimina"
              onclick="return confirm('Eliminare questo contatto? Non si torna indietro.')"
            >elimina</button>
          </form>
        </td>
      </tr>`;
      })
      .join('') || '<tr><td colspan="4" class="sm">Nessun contatto ricevuto per ora.</td></tr>';

  return `<!doctype html><html lang="it"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Contatti ricevuti · GSA</title>
<style>
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#faf9f5;color:#16160f}
  header{background:#16160f;color:#fff;padding:1.1rem 1.25rem;border-bottom:4px solid #ffdd00;display:flex;justify-content:space-between;align-items:center}
  h1{margin:0;font-size:1.15rem}
  .cnt{padding:1rem 1.25rem;max-width:1000px;margin:0 auto}
  .riepilogo{display:flex;gap:1.5rem;margin:0 0 1rem;flex-wrap:wrap}
  .riepilogo div{background:#fff;border:1px solid #e6e4dc;border-radius:.9rem;padding:.7rem 1rem}
  .riepilogo b{display:block;font-size:1.5rem}
  table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e6e4dc;border-radius:.9rem;overflow:hidden}
  td{padding:.8rem;border-top:1px solid #efeee8;vertical-align:top;font-size:.9rem}
  tr.urgente{background:#fffdf0}
  .sm{font-size:.78rem;color:#6b6b60}
  .msg{margin-top:.35rem;font-size:.82rem;color:#3c3c33}
  .tag{background:#ffdd00;font-size:.68rem;font-weight:700;padding:.1rem .45rem;border-radius:999px;margin-left:.35rem}
  .azioni{display:flex;flex-wrap:wrap;gap:.3rem}
  .b{border:1px solid #d8d6cc;background:#fff;border-radius:999px;padding:.25rem .6rem;font-size:.72rem;cursor:pointer}
  .b:hover{background:#ffdd00;border-color:#ffdd00}
  .elimina{color:#9b2c2c;border-color:#e8cfcf}
  .elimina:hover{background:#9b2c2c;border-color:#9b2c2c;color:#fff}
</style></head><body>
<header><h1>Contatti ricevuti dal sito</h1>
  <form method="POST" class="esci"><button name="esci" value="1" class="b">esci</button></form>
</header>
<div class="cnt">
  <div class="riepilogo">
    <div><b>${leads.length}</b><span class="sm">totali</span></div>
    <div><b>${aperti.length}</b><span class="sm">richieste aperte</span></div>
    <div><b>${daFare}</b><span class="sm">da richiamare oggi</span></div>
    <div><b>${iscritti.length}</b><span class="sm">iscritti newsletter</span></div>
  </div>
  <table><tbody>${righe}</tbody></table>
  <p class="sm">
    Pagina privata: non compare nel sito e non finisce su Google. Questo elenco non manda
    nessuna email: i messaggi nuovi arrivano come sempre dal modulo contatti.
  </p>
</div></body></html>`;
}

function paginaAccesso(errore) {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Accesso · Contatti GSA</title>
<style>
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#faf9f5;color:#16160f;display:grid;place-items:center;min-height:100vh}
  form{background:#fff;border:1px solid #e6e4dc;border-top:4px solid #ffdd00;border-radius:.9rem;padding:1.5rem;width:min(90vw,360px)}
  h1{margin:0 0 1rem;font-size:1.1rem}
  input{width:100%;box-sizing:border-box;padding:.6rem;border:1px solid #d8d6cc;border-radius:.5rem;font-size:1rem}
  button{margin-top:.8rem;width:100%;padding:.6rem;border:0;border-radius:999px;background:#ffdd00;font-weight:700;cursor:pointer}
  .err{color:#9b2c2c;font-size:.85rem}
</style></head><body>
<form method="POST">
  <h1>Contatti ricevuti dal sito</h1>
  ${errore ? '<p class="err">Chiave non valida.</p>' : ''}
  <label for="chiave">Chiave di accesso</label>
  <input id="chiave" name="accesso" type="password" autocomplete="current-password" required autofocus />
  <button>Entra</button>
</form></body></html>`;
}

// Accesso senza token nell'URL (che finirebbe in cronologia, segnalibri e log):
// la chiave si scrive una volta in un modulo e la sessione vive in un cookie
// HttpOnly firmato, valido 12 ore. Se è impostata LEAD_ADMIN_TOKEN la pagina
// usa quella e il webhook resta con LEAD_WEBHOOK_TOKEN: chi vede l'URL del
// webhook nella configurazione di Netlify non può leggere i contatti.
const COOKIE = 'gsa_contatti';
const DURATA_SESSIONE = 12 * 3600;

const uguali = (a, b) => {
  const x = Buffer.from(String(a ?? ''));
  const y = Buffer.from(String(b ?? ''));
  return x.length === y.length && timingSafeEqual(x, y);
};

const firma = (chiave, scadenza) =>
  createHmac('sha256', chiave).update(`sessione:${scadenza}`).digest('hex');

function sessioneValida(req, chiave) {
  const valore = (req.headers.get('cookie') || '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  const [scadenza, f] = (valore || '').split('.');
  return Number(scadenza) > Date.now() / 1000 && uguali(f, firma(chiave, scadenza));
}

export default async (req) => {
  const url = new URL(req.url);
  const chiave = process.env.LEAD_ADMIN_TOKEN || process.env.LEAD_WEBHOOK_TOKEN;
  const headers = {
    'content-type': 'text/html; charset=utf-8',
    'x-robots-tag': 'noindex',
    'cache-control': 'no-store',
    'referrer-policy': 'no-referrer',
    'x-frame-options': 'DENY',
    'content-security-policy':
      "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  };
  const torna = (extra = {}) =>
    new Response(null, {
      status: 303,
      headers: { ...headers, location: '/api/contatti', ...extra },
    });

  if (!chiave) return new Response('<h1>Non configurato</h1>', { status: 503, headers });

  let form = null;
  if (req.method === 'POST') {
    // Le azioni arrivano solo da questa pagina: SameSite=Strict sul cookie più
    // il controllo dell'origine bloccano i moduli inviati da altri siti.
    const origine = req.headers.get('origin');
    if (origine && origine !== url.origin) {
      return new Response('<h1>Richiesta non valida</h1>', { status: 403, headers });
    }
    try {
      form = await req.formData();
    } catch {
      return new Response('<h1>Richiesta non valida</h1>', { status: 400, headers });
    }
  }

  if (form?.has('accesso')) {
    if (!uguali(form.get('accesso'), chiave)) {
      return new Response(paginaAccesso(true), { status: 401, headers });
    }
    const scadenza = Math.floor(Date.now() / 1000) + DURATA_SESSIONE;
    return torna({
      'set-cookie': `${COOKIE}=${scadenza}.${firma(chiave, scadenza)}; Path=/api/contatti; Max-Age=${DURATA_SESSIONE}; HttpOnly; Secure; SameSite=Strict`,
    });
  }

  if (!sessioneValida(req, chiave)) {
    return new Response(paginaAccesso(false), { status: 401, headers });
  }

  if (form?.has('esci')) {
    return torna({
      'set-cookie': `${COOKIE}=; Path=/api/contatti; Max-Age=0; HttpOnly; Secure; SameSite=Strict`,
    });
  }

  const azione = form && {
    id: form.get('id'),
    stato: form.get('stato'),
    elimina: form.get('elimina') === '1',
  };
  const elenco = getStore('lead');

  // Rimozione dall'archivio (contatti di prova, doppioni, richieste di cancellazione).
  if (azione?.id && azione.elimina) {
    await elenco.delete(azione.id).catch(() => {});
    return torna();
  }

  // Aggiornamento stato.
  if (azione?.id && STATI.includes(azione.stato)) {
    const lead = await elenco.get(azione.id, { type: 'json' }).catch(() => null);
    if (lead) {
      await elenco.setJSON(azione.id, {
        ...lead,
        stato: azione.stato,
        prossimoFollowUp: APERTI.includes(azione.stato) ? oggiISO(3) : null,
        storico: [
          ...(lead.storico || []),
          { data: new Date().toISOString(), tipo: 'stato', note: `Passato a ${azione.stato}.` },
        ],
      });
    }
    return torna();
  }

  const { blobs } = await elenco.list();
  const leads = (
    await Promise.all(blobs.map((b) => elenco.get(b.key, { type: 'json' }).catch(() => null)))
  )
    .filter(Boolean)
    .sort((a, b) => String(b.creato).localeCompare(String(a.creato)));

  return new Response(pagina(leads), { headers });
};
