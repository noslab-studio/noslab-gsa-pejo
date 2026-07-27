import { getStore } from '@netlify/blobs';

/**
 * Pagina privata con l'elenco dei contatti ricevuti e i pulsanti per aggiornare
 * lo stato. Si apre solo con il token: /api/contatti?token=...
 * Non è indicizzabile e non è linkata da nessuna parte del sito.
 */
export const config = { path: '/api/contatti' };

const STATI = ['nuovo', 'contattato', 'in_trattativa', 'cliente', 'perso'];
const APERTI = ['nuovo', 'contattato', 'in_trattativa'];

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

function pagina(leads, token) {
  const oggi = oggiISO();
  const aperti = leads.filter((l) => APERTI.includes(l.stato));
  const daFare = aperti.filter((l) => l.prossimoFollowUp && l.prossimoFollowUp <= oggi).length;

  const righe =
    leads
      .map((l) => {
        const urgente =
          APERTI.includes(l.stato) && l.prossimoFollowUp && l.prossimoFollowUp <= oggi;
        const recapiti = [
          l.email ? `<a href="mailto:${esc(l.email)}">${esc(l.email)}</a>` : '',
          l.telefono ? `<a href="tel:${esc(l.telefono)}">${esc(l.telefono)}</a>` : '',
        ]
          .filter(Boolean)
          .join(' · ');

        const bottoni = STATI.filter((s) => s !== l.stato)
          .map((s) => `<button name="stato" value="${s}" class="b">${s.replace('_', ' ')}</button>`)
          .join('');

        return `<tr class="${urgente ? 'urgente' : ''}">
        <td>
          <strong>${esc(l.nome || 'senza nome')}</strong>
          ${urgente ? '<span class="tag">da richiamare</span>' : ''}
          <div class="sm">${recapiti}</div>
          ${l.messaggio ? `<div class="msg">${esc(l.messaggio).slice(0, 300)}</div>` : ''}
        </td>
        <td class="sm">${esc(l.fonte)}<br />${dataIt(l.creato)}</td>
        <td class="sm"><strong>${esc(l.stato).replace('_', ' ')}</strong><br />ricontatto: ${esc(l.prossimoFollowUp || '-')}</td>
        <td>
          <form method="POST" class="azioni">
            <input type="hidden" name="token" value="${esc(token)}" />
            <input type="hidden" name="id" value="${esc(l.id)}" />
            ${bottoni}
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
  header{background:#16160f;color:#fff;padding:1.1rem 1.25rem;border-bottom:4px solid #ffdd00}
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
</style></head><body>
<header><h1>Contatti ricevuti dal sito</h1></header>
<div class="cnt">
  <div class="riepilogo">
    <div><b>${leads.length}</b><span class="sm">totali</span></div>
    <div><b>${aperti.length}</b><span class="sm">aperti</span></div>
    <div><b>${daFare}</b><span class="sm">da richiamare oggi</span></div>
  </div>
  <table><tbody>${righe}</tbody></table>
  <p class="sm">Pagina privata: non compare nel sito e non finisce su Google.</p>
</div></body></html>`;
}

export default async (req) => {
  const url = new URL(req.url);
  const atteso = process.env.LEAD_WEBHOOK_TOKEN;
  const headers = { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' };

  let token = url.searchParams.get('token');
  let azione = null;

  if (req.method === 'POST') {
    const form = await req.formData();
    token = form.get('token');
    azione = { id: form.get('id'), stato: form.get('stato') };
  }

  if (!atteso || token !== atteso) {
    return new Response('<h1>Non autorizzato</h1>', { status: 401, headers });
  }

  const elenco = getStore('lead');

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
    return new Response(null, {
      status: 303,
      headers: { location: `/api/contatti?token=${encodeURIComponent(token)}` },
    });
  }

  const { blobs } = await elenco.list();
  const leads = (
    await Promise.all(blobs.map((b) => elenco.get(b.key, { type: 'json' }).catch(() => null)))
  )
    .filter(Boolean)
    .sort((a, b) => String(b.creato).localeCompare(String(a.creato)));

  return new Response(pagina(leads, token), { headers });
};
