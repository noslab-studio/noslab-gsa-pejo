# noslab-gsa-pejo

Redesign del sito di **GSA di Grassi Simona Adele** — consulente digitale e fotografa,
attualmente su https://gsa-pejo.com/.

> ⚠️ "GSA" = iniziali di **Grassi Simona Adele**; "Pejo" è il paese (Val di Pejo, TN)
> dove ha sede l'impresa individuale. **Non è uno sci club** (il "Gruppo Sportivo Amatori"
> del brief iniziale era un equivoco: il sito è la vetrina professionale di Simona).

## Obiettivo

- Ricostruire il sito professionale di Simona mantenendo **identità e contenuti** attuali,
  ma con qualità, velocità ed efficacia (SEO) molto superiori.
- **Vetrina dei servizi** (consulenza digitale, social, pubblicità digitale e tradizionale,
  fotografia, gestione ufficio/fatturazione) e portfolio, radicata nel contesto
  **Pejo/montagna** — sua cifra estetica e bacino locale (TN/BS/BG).
- Simona è **commerciale NosLab**: il sito è anche il suo biglietto da visita verso i clienti.
  La qualità deve essere impeccabile.

## Problema del sito attuale → soluzione

- **Problema**: il sito attuale è un export renderizzato **lato client**. L'HTML servito ai
  crawler è vuoto → il sito è di fatto **invisibile su Google** (SEO nulla).
- **Soluzione**: nuovo sito **pre-renderizzato staticamente con Astro**. HTML completo già
  nel sorgente servito → pienamente indicizzabile, velocissimo, con structured data inline.

## Stack

- **Astro** (output statico) + **Tailwind CSS v4** + **TypeScript strict**
- Content Collections (schema Zod) per `projects` (case study) e `services`
- Deploy su **Netlify** (build statica)
- Lingua: **it**. Package manager: **npm**.

## Convenzioni

- **Conventional commits** (`feat:`, `fix:`, `chore:`, `docs:`, …).
- Flusso: **branch → PR → deploy preview Netlify → merge in `main`**.
- **Nessun secret nel repo**: usare `.env` (git-ignored) + variabili d'ambiente su Netlify.
  `.env.example` documenta le variabili richieste.
- **Mobile-first**, lingua **italiana** in contenuti e nomi di dominio (campi collection in it).
- Immagini ottimizzate (asset locali + helper `image()` nelle collection).

## Quality gate (non negoziabile)

- **Lighthouse ≥ 95** in tutte le categorie (Performance, Accessibility, Best Practices, SEO),
  sia **mobile** che **desktop**.
- **Accessibilità WCAG 2.1 AA**.
- **Structured data valido** (JSON-LD: ProfessionalService/LocalBusiness + Person).
- **0 errori in console**.
- SEO corretta (canonical, Open Graph/Twitter, sitemap) e **GDPR pulito**.

## Comandi principali

```bash
npm run dev          # dev server (usare "astro dev --background" per il background mode)
npm run build        # build statica in dist/
npm run preview      # anteprima locale della build
npm run check        # astro check (type-check dei template)
npm run lint         # ESLint
npm run format       # Prettier --write
```

Dev server in background (gestione): `astro dev --background`, poi
`astro dev stop | status | logs`.

## Struttura d'agenzia NosLab (convenzione per progetti cliente)

Vale per questo progetto e per i clienti futuri:

- **Un'unica organizzazione GitHub `noslab-studio`** per tutti i progetti cliente
  (niente org separata per cliente; owner = account `NosLab-Sas`).
- **Naming repo**: `noslab-<cliente>-<progetto>` (es. `noslab-gsa-pejo`).
  Repo interni NosLab: `noslab-<tool>` (es. `noslab-cms`, `noslab-team`).
- **Regola d'oro**: *1 cliente = 1 repo `noslab-<cliente>-…` + 1 site Netlify
  (team `noslab-sas`) + accesso **Read** scoped al solo repo per il cliente.*
- **Permessi**: team interno `staff` con accesso completo; ai clienti si dà accesso
  come **Outside Collaborator** in sola lettura **solo** sul loro repo (mai membri
  pieni dell'org → non vedono gli altri clienti né gli strumenti interni).
- **Netlify**: un site per repo, nome site = nome repo, deploy preview sulle PR;
  dominio custom del cliente collegato al suo site.
- **Vincolo Netlify Free**: non fa deploy di repo **privati** di proprietà di
  un'Organization → tenere i repo cliente **pubblici** (nessun secret nel repo,
  `.env` git-ignored) oppure passare a Netlify Pro. `noslab-gsa-pejo` è pubblico
  per questo motivo.

## Regola di lavoro: **pianifica prima di eseguire**

Procedere in modo **incrementale**. Prima di **qualsiasi azione remota o distruttiva**
(creazione repo/site, push, deploy, cancellazioni), **mostrare il piano e attendere l'ok**.
Non creare risorse remote senza conferma esplicita dei nomi.

## Documentazione Astro

Documentazione completa: https://docs.astro.build — vedere anche `AGENTS.md`.
