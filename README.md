# noslab-gsa-pejo

Sito professionale di GSA di Grassi Simona Adele, consulente digitale e fotografa a Peio
(Val di Pejo, TN): https://gsa-pejo.com. Progetto curato da NosLab.

Sito statico pre-renderizzato con Astro, così Google legge l'HTML completo, più alcune
Netlify Functions per l'assistente AI, l'elenco contatti e le attività programmate.
Regole di lavoro e quality gate sono in [CLAUDE.md](CLAUDE.md).

## Stack

- Astro (output statico), Tailwind CSS v4, TypeScript strict
- Netlify: hosting, Forms, Functions, Blobs, AI Gateway
- Package manager: npm, Node 22 (vedi `.nvmrc`)

## Comandi

```bash
npm install          # dipendenze
npm run dev          # server di sviluppo (in background: astro dev --background)
npm run build        # build statica in dist/
npm run preview      # anteprima locale della build
npm run lint         # ESLint
npm run format       # Prettier
```

## Struttura

```text
src/pages/            pagine del sito (una per file)
src/components/       componenti Astro (chatbot, recensioni, neve, schema.org, ...)
src/content/services/ schede dei servizi (content collection)
src/lib/natale.mjs    quando accendere la veste natalizia
src/assets/           immagini ottimizzate in build (foto, logo)
public/               file serviti così come sono (favicon, video, robots.txt)
netlify/functions/    funzioni lato server
```

## Funzioni Netlify

| Funzione                  | Cosa fa                                                     | Quando                |
| :------------------------ | :---------------------------------------------------------- | :-------------------- |
| `chat.mjs`                | assistente AI su `/api/chat`, con limiti anti-abuso         | a ogni domanda        |
| `lead-ingest.mjs`         | salva in Netlify Blobs i contatti dei moduli                | webhook dei Forms     |
| `lead-elenco.mjs`         | pagina privata `/api/contatti` per consultare i contatti    | su richiesta          |
| `pulizia-chat.mjs`        | cancella i contatori della chat non più necessari           | ogni notte, 03:15 UTC |
| `pulizia-lead.mjs`        | cancella i contatti inattivi da 24 mesi                     | lunedì, 04:00 UTC     |
| `aggiorna-recensioni.mjs` | ricostruisce il sito per aggiornare le recensioni Google    | lunedì, 05:30 UTC     |
| `veste-natalizia.mjs`     | accende o spegne neve e auguri lanciando una build se serve | ogni sera, 23:05 UTC  |

Le variabili d'ambiente sono documentate in [.env.example](.env.example). Nessun segreto
va nel repository, che è pubblico: i valori stanno solo su Netlify e nel `.env` locale.

## Flusso di lavoro

Branch, pull request, deploy preview di Netlify, merge in `main`, che va in produzione.
Commit in formato conventional (`feat:`, `fix:`, `chore:`, ...). Lighthouse si misura in
produzione: sui deploy preview Netlify aggiunge `noindex` e una barra che falsano i punteggi.
