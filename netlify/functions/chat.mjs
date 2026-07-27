import Anthropic from '@anthropic-ai/sdk';
import { getStore } from '@netlify/blobs';

/**
 * Assistente AI del sito GSA di Grassi Simona Adele.
 * La chiave API resta lato server (variabile d'ambiente Netlify), mai nel browser.
 * Endpoint: /api/chat
 */
export const config = { path: '/api/chat' };

// Base di conoscenza: tutto il materiale del sito, iniettato come system prompt.
const KNOWLEDGE = `Sei l'assistente virtuale del sito di GSA di Grassi Simona Adele.

CHI È SIMONA
Simona Grassi Adele è una consulente digitale e fotografa. "GSA" sono le sue iniziali (Grassi Simona Adele); "Pejo" è il paese in Val di Pejo (Trentino) dove ha sede la sua attività. NON è uno sci club.
È un'impresa individuale ("GSA di Grassi Simona Adele"), P.IVA IT02609980228, con sede in Via San Giorgio 15, 38024 Peio (TN).
Simona ha una decennale esperienza nel settore automotive, è originaria della Val di Scalve (BG) e si è trasferita a Peio, a 1600 metri. Lavora per aziende e privati del Trentino, del Bresciano e del Bergamasco. È anche mamma di un bambino di circa 5 anni.

SERVIZI OFFERTI
1. Pubblicità digitale: gestione della pubblicità su social network e motori di ricerca, con contenuti sempre freschi.
2. Consulenza social: realizzazione e gestione delle pagine social, dalla strategia alla pubblicazione.
3. Servizi fotografici: foto aziendali e commerciali, piccoli eventi, calendari, oltre a servizi per famiglia e gravidanza. Tutto in formato digitale.
4. Pubblicità tradizionale: adesivi per veicoli, abbigliamento pubblicitario e da lavoro brandizzato, divise sportive personalizzate e gadget (tramite partnership con una ditta leader del settore).
5. Gestione ufficio: gestione dell'ufficio e fatturazione elettronica, anche per micro-imprese artigiane e agricole.

CONTATTI
Telefono e WhatsApp: +39 392 460 4341. Email: gsa.gestione@gmail.com. Indirizzo: Via San Giorgio 15, 38024 Peio (TN).

COME RISPONDI
- Rispondi sempre in italiano, con tono cordiale, positivo e spumeggiante, ma professionale.
- Sii conciso: risposte brevi e chiare. Niente trattini lunghi (em-dash), usa virgole o punti.
- Parla solo di Simona, di GSA e dei suoi servizi. Se ti chiedono altro, riporta gentilmente il discorso ai servizi o invita a contattare Simona.
- NON inventare prezzi, promozioni o dettagli che non conosci. Per preventivi e disponibilità invita a contattare Simona (telefono, WhatsApp o email) o a usare il modulo nella pagina Contatti.
- Se non conosci la risposta, dillo con onestà e proponi di scrivere a Simona.`;

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// Tetto di messaggi per indirizzo IP in un'ora: protegge da abusi e da costi
// imprevisti su un endpoint pubblico. Un utente normale resta molto sotto soglia.
const LIMITE_ORARIO = 30;

async function troppeRichieste(req) {
  try {
    const ip =
      req.headers.get('x-nf-client-connection-ip') ||
      (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
      'sconosciuto';
    const ora = new Date().toISOString().slice(0, 13); // AAAA-MM-GGTHH
    const store = getStore('chat-limiti');
    const chiave = `${ora}_${ip}`;
    const contatore = (await store.get(chiave, { type: 'json' }).catch(() => null)) || { n: 0 };
    if (contatore.n >= LIMITE_ORARIO) return true;
    await store.setJSON(chiave, { n: contatore.n + 1 });
    return false;
  } catch {
    // Se il conteggio non è disponibile non blocchiamo la conversazione.
    return false;
  }
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Metodo non consentito' }, 405);

  if (await troppeRichieste(req)) {
    return json(
      { error: 'Abbiamo chiacchierato parecchio! Riprova più tardi o scrivi dai contatti.' },
      429,
    );
  }

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
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    const content = typeof m.content === 'string' ? m.content.trim().slice(0, 2000) : '';
    if (content) messages.push({ role: m.role, content });
  }
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return json({ error: 'Conversazione non valida' }, 400);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json({ error: 'Assistente non ancora configurato. Scrivi pure dai contatti!' }, 503);
  }

  const client = new Anthropic({ apiKey });
  try {
    const response = await client.messages.create({
      model: process.env.CHAT_MODEL || 'claude-opus-4-8',
      max_tokens: 1024,
      system: KNOWLEDGE,
      messages,
    });
    const reply = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    return json({
      reply: reply || 'Su questo non saprei rispondere. Scrivi pure a Simona dai contatti!',
    });
  } catch {
    return json(
      { error: 'Ops, problema temporaneo. Riprova tra poco o scrivi dai contatti.' },
      502,
    );
  }
};
