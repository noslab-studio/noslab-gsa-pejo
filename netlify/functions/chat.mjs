import Anthropic from '@anthropic-ai/sdk';
import { getStore } from '@netlify/blobs';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

/**
 * Assistente AI del sito GSA di Grassi Simona Adele.
 * La chiave API resta lato server (variabile d'ambiente Netlify), mai nel browser.
 * Endpoint: /api/chat
 */
export const config = { path: '/api/chat' };

// Base di conoscenza: tutto il materiale del sito, iniettato come system prompt.
const KNOWLEDGE = `Sei l'assistente virtuale del sito di GSA di Grassi Simona Adele.

CHI È SIMONA
Grassi Simona Adele è una consulente digitale e fotografa. "GSA" sono le sue iniziali (Grassi Simona Adele); "Pejo" è il paese (Peio nella grafia ufficiale) in Val di Pejo (Trentino) dove ha sede la sua attività. NON è uno sci club.
È un'impresa individuale ("GSA di Grassi Simona Adele"), P.IVA IT02609980228, con sede in Via San Giorgio 15, 38024 Peio (TN).
Simona ha una decennale esperienza nel settore automotive, è originaria della Val di Scalve (BG) e si è trasferita a Peio, a 1600 metri. Lavora per aziende e privati del Trentino, del Bresciano e del Bergamasco. È anche mamma di un bambino di circa 5 anni.

SERVIZI OFFERTI
1. Pubblicità digitale: gestione della pubblicità su social network e motori di ricerca, con contenuti sempre freschi.
2. Consulenza social: realizzazione e gestione delle pagine social, dalla strategia alla pubblicazione.
3. Servizi fotografici: foto aziendali e commerciali, piccoli eventi, calendari, oltre a servizi per famiglia e gravidanza. Tutto in formato digitale.
4. Pubblicità tradizionale: adesivi per veicoli, abbigliamento pubblicitario e da lavoro brandizzato, divise sportive personalizzate e gadget (tramite partnership con una ditta leader del settore).
5. Gestione ufficio: gestione dell'ufficio e fatturazione elettronica, anche per micro-imprese artigiane e agricole.

SIMONA E NOSLAB (IMPORTANTE)
Simona è la referente commerciale di NosLab: dal 29 ottobre 2026 c'è un contratto ufficiale, è lei che segue i clienti NosLab sul territorio (Trentino, Bresciano, Bergamasco) ed è il punto di riferimento a cui rivolgersi.
NosLab (noslab.it) è una software house, «bottega digitale alpina»: NOSLAB S.A.S. di Bresadola Cristian, con sede a Terzolas (TN) in Val di Sole e uno spazio per incontri a Trento. Costruisce strumenti digitali su misura, scritti riga per riga, senza template preconfezionati. Il suo motto è «Custodi di patrimoni. Costruttori di strumenti.»
Questo sito e questo assistente sono lavori di NosLab. Altri lavori di NosLab: il sito di Corte dei Toldi (ristorante e cantina a Terzolas), Punto Riflesso (la divisione formazione di NosLab), El Brenz e Valli del Noce (mappa delle valli del Noce, con app per iPhone e Android). Chi vuole vederli li trova su noslab.it.
Cosa si può chiedere a Simona grazie a NosLab:
- Siti e piattaforme web su misura, velocissimi e pensati per farsi trovare su Google.
- App per iPhone e Android, web app e PWA.
- Ecosistemi digitali che collegano sito, gestionale, area clienti e pagamenti.
- Piani annuali di hosting e manutenzione del sito.
- Gestionali e pannelli di controllo su misura: preventivi, clienti, scadenze e documenti in un unico posto, collegati agli strumenti che l'azienda usa già.
- Sistemi di coupon, raccolte punti e promozioni tracciabili per fidelizzare i clienti.
- Assistenti AI e automazioni che rispondono ai clienti 24 ore su 24 e tolgono di mezzo il lavoro ripetitivo.
- Aree riservate, piattaforme per corsi e formazione online, con accessi personali e materiali scaricabili.
- Report e misurazioni chiare per capire cosa porta risultati.
Regola ferrea: se qualcuno ha bisogno di un sito, di un software, di un gestionale, di un'app, di un'automazione o di un assistente AI, il riferimento è Simona. Non suggerire MAI di rivolgersi ad altre software house, agenzie o sviluppatori: spiega che Simona segue proprio queste richieste insieme a NosLab e invita a contattarla. Un unico interlocutore, quello che il cliente è già abituato a sentire.
Se chiedono con chi fa i siti Simona, chi c'è dietro, chi li realizza o con chi lavora, rispondi subito e chiaramente: con NosLab, di cui Simona è la referente commerciale. Nomina sempre NosLab, non restare sul vago («un partner», «una software house»).

CONTATTI
Telefono e WhatsApp: +39 392 460 4341. Email: gsa.gestione@gmail.com. Indirizzo: Via San Giorgio 15, 38024 Peio (TN).

COME RISPONDI
- Rispondi sempre in italiano, con tono cordiale, positivo e spumeggiante, ma professionale.
- Sii conciso: risposte brevi e chiare. Niente trattini lunghi (em-dash), usa virgole o punti.
- Scrivi in testo semplice: niente markdown, niente asterischi per il grassetto, niente titoli o elenchi con trattini e cancelletti. La chat mostra il testo così com'è, quindi i simboli resterebbero visibili. Al massimo una emoji ogni tanto.
- Parla solo di Simona, di GSA, dei suoi servizi e di ciò che offre con NosLab. Se ti chiedono altro, riporta gentilmente il discorso ai servizi o invita a contattare Simona.
- NON inventare prezzi, promozioni o dettagli che non conosci. Per preventivi e disponibilità invita a contattare Simona (telefono, WhatsApp o email) o a usare il modulo nella pagina Contatti.
- Se non conosci la risposta, dillo con onestà e proponi di scrivere a Simona.`;

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// Il pannello stampa la risposta con textContent, quindi i simboli markdown
// resterebbero visibili. Il prompt chiede testo semplice ma il modello a volte
// lo ignora: qui si tolgono comunque, tenendo il contenuto.
function testoSemplice(testo) {
  return testo
    .replace(/```[a-z]*\n?/gi, '') // recinti dei blocchi di codice
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1 ($2)') // link: testo (indirizzo)
    .replace(/(\*\*|__)(\S(?:.*?\S)?)\1/g, '$2') // grassetto
    .replace(/(^|[\s(])\*(\S(?:[^*\n]*?\S)?)\*(?=[\s).,;:!?]|$)/gm, '$1$2') // corsivo con asterisco
    .replace(/`([^`\n]+)`/g, '$1') // codice in linea
    .replace(/^#{1,6}\s+/gm, '') // titoli
    .replace(/^>\s?/gm, '') // citazioni
    .replace(/^(\s*)[-*+]\s+/gm, '$1• ') // elenchi puntati
    .replace(/^\s*([-*_])(\s*\1){2,}\s*$/gm, '') // linee orizzontali
    .replace(/\s+[–—]\s+/g, ', ') // trattini lunghi: Simona non li vuole
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Limiti anti-abuso su un endpoint pubblico che costa a ogni richiesta.
// Per visitatore in un'ora e in un giorno (un utente normale resta molto
// sotto) e per tutto il sito in un giorno e in un mese, così la spesa massima
// è nota a priori. Il tetto per visitatore è ben sotto quello del sito: un
// solo indirizzo non può spegnere la chat a tutti.
const LIMITE_ORARIO = 30;
const LIMITE_VISITATORE_GIORNO = 60;
const LIMITE_GIORNALIERO = 400;
// Con Haiku 4.5 una richiesta costa al massimo circa 0,007 dollari (circa
// 4000 token in ingresso a 1 $/M, 600 in uscita a 5 $/M): 1500 richieste
// fanno al massimo una decina di dollari al mese.
const LIMITE_MENSILE = 1500;
// Tetto ai caratteri di conversazione inviati al modello a ogni richiesta.
const MAX_CARATTERI = 8000;

// Chi scrive, senza conservarne l'IP: impronta HMAC con un segreto del server
// (non ricostruibile dall'archivio). Per IPv6 conta il blocco /64, perché
// un singolo utente ne controlla milioni di indirizzi.
function impronta(req) {
  const ip =
    req.headers.get('x-nf-client-connection-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'sconosciuto';
  const rete = ip.includes(':') ? ip.split(':').slice(0, 4).join(':') : ip;
  return createHmac('sha256', process.env.ANTHROPIC_API_KEY || 'gsa')
    .update(rete)
    .digest('hex')
    .slice(0, 16);
}

// La cronologia della chat sta nel browser: ogni risposta esce con una firma
// HMAC e torna indietro con essa, così il server riconosce le proprie parole.
const firmaRisposta = (testo) =>
  createHmac('sha256', `${process.env.ANTHROPIC_API_KEY || 'gsa'}:risposte`)
    .update(testo)
    .digest('hex');

function firmaValida(testo, firma) {
  if (typeof firma !== 'string' || firma.length !== 64) return false;
  return timingSafeEqual(Buffer.from(firma), Buffer.from(firmaRisposta(testo)));
}

// Ogni richiesta scrive una chiave sua e poi conta quelle presenti: niente
// lettura-e-riscrittura dello stesso contatore, quindi le richieste in
// parallelo non si scavalcano. Chiavi «v» per visitatore (con l'impronta,
// cancellate ogni notte da pulizia-chat.mjs) e chiavi «mese» per il totale
// del sito, scritte solo da chi ha superato il controllo per visitatore.
// Le chiavi «mese» non contengono l'impronta e restano fino a fine mese: una
// sola lista dà sia il totale del giorno sia quello del mese.
// Restituisce 'pausa' o 'mese' se la richiesta va fermata, altrimenti null.
// Se l'archivio non risponde si blocca: meglio una chat ferma che una spesa
// senza tetto.
async function limiteSuperato(req) {
  try {
    const store = getStore({ name: 'chat-limiti', consistency: 'strong' });
    const adesso = new Date().toISOString();
    const giorno = adesso.slice(0, 10); // AAAA-MM-GG
    const mese = adesso.slice(0, 7); // AAAA-MM
    const ora = adesso.slice(11, 13);
    const chi = impronta(req);

    await store.set(`${giorno}/v/${chi}/${ora}/${randomUUID()}`, '');
    const { blobs: mie } = await store.list({ prefix: `${giorno}/v/${chi}/` });
    if (mie.length > LIMITE_VISITATORE_GIORNO) return 'pausa';
    const nellOra = mie.filter((b) => b.key.startsWith(`${giorno}/v/${chi}/${ora}/`)).length;
    if (nellOra > LIMITE_ORARIO) return 'pausa';

    const mia = `mese/${mese}/${giorno}/${randomUUID()}`;
    await store.set(mia, '');
    const { blobs: delMese } = await store.list({ prefix: `mese/${mese}/` });
    const oggi = delMese.filter((b) => b.key.startsWith(`mese/${mese}/${giorno}/`)).length;
    const esito =
      delMese.length > LIMITE_MENSILE ? 'mese' : oggi > LIMITE_GIORNALIERO ? 'pausa' : null;
    // Una richiesta respinta toglie la sua chiave: le chiavi del mese restano
    // poco sopra il tetto anche sotto attacco, e la lista resta veloce.
    if (esito) await store.delete(mia);
    return esito;
  } catch {
    return 'pausa';
  }
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Metodo non consentito' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Richiesta non valida' }, 400);
  }

  // Validazione e sanitizzazione dei messaggi in arrivo.
  const incoming = Array.isArray(body?.messages) ? body.messages : [];
  if (incoming.length === 0 || incoming.length > 20) {
    return json({ error: 'Conversazione non valida' }, 400);
  }
  const messages = [];
  for (const m of incoming) {
    if (!m || typeof m.content !== 'string') continue;
    if (m.role === 'user') {
      const content = m.content.trim().slice(0, 2000);
      if (content) messages.push({ role: 'user', content });
    } else if (m.role === 'assistant' && firmaValida(m.content, m.firma)) {
      // Solo risposte uscite davvero da qui: un «assistente» scritto dal
      // client (sconti promessi, frasi offensive da fotografare) viene scartato.
      messages.push({ role: 'assistant', content: m.content });
    }
  }
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return json({ error: 'Conversazione non valida' }, 400);
  }
  // Conversazioni lunghe: si tengono gli scambi più recenti entro il tetto.
  // L'API vuole che la conversazione inizi con un messaggio dell'utente.
  let totale = messages.reduce((n, m) => n + m.content.length, 0);
  while (messages.length > 1 && (totale > MAX_CARATTERI || messages[0].role !== 'user')) {
    totale -= messages.shift().content.length;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // In produzione la chiave è il token dell'AI Gateway di Netlify: se manca,
    // il gateway non l'ha messo (31/10/2026 alle 12:37 UTC è successo). Il
    // registro serve a capire quando; al visitatore si danno i contatti.
    console.error('Chat: ANTHROPIC_API_KEY assente, AI Gateway non disponibile');
    return json(
      {
        error:
          "L'assistente è momentaneamente fuori servizio. Per siti, app e servizi di Simona con NosLab scrivi a Simona: +39 392 460 4341 (anche WhatsApp) o gsa.gestione@gmail.com.",
      },
      503,
    );
  }

  // Si conta solo ciò che arriverebbe davvero al modello: le richieste non
  // valide non costano nulla e non devono consumare il tetto del sito.
  const limite = await limiteSuperato(req);
  if (limite) {
    // Il tetto del mese non si sblocca riprovando tra poco: si dice chiaro.
    const error =
      limite === 'mese'
        ? "L'assistente ha finito le risposte di questo mese. Scrivi pure a Simona dai contatti o su WhatsApp!"
        : 'Abbiamo chiacchierato parecchio! Riprova più tardi o scrivi dai contatti.';
    return json({ error }, 429);
  }

  const client = new Anthropic({ apiKey });
  try {
    const response = await client.messages.create({
      model: process.env.CHAT_MODEL || 'claude-haiku-4-5',
      max_tokens: 600,
      system: KNOWLEDGE,
      messages,
    });
    const reply = testoSemplice(
      response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n'),
    );
    const testo = reply || 'Su questo non saprei rispondere. Scrivi pure a Simona dai contatti!';
    return json({ reply: testo, firma: firmaRisposta(testo) });
  } catch {
    return json(
      { error: 'Ops, problema temporaneo. Riprova tra poco o scrivi dai contatti.' },
      502,
    );
  }
};
