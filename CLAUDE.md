# noslab-gsa-pejo

Redesign del sito del **GSA Peio** (Gruppo Sportivo Amatori, sci club in Val di Pejo),
attualmente su https://gsa-pejo.com/.

## Obiettivo

- Ricostruire il sito del GSA Peio mantenendo **identità e contenuti** attuali, ma con
  qualità, velocità ed efficacia molto superiori.
- **Doppia funzione**: il sito è anche **vetrina/portfolio di Simona** (commerciale NosLab)
  verso i suoi clienti. La qualità deve essere impeccabile.

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
- **Structured data valido** (JSON-LD: SportsClub/Organization + Event).
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

## Regola di lavoro: **pianifica prima di eseguire**

Procedere in modo **incrementale**. Prima di **qualsiasi azione remota o distruttiva**
(creazione repo/site, push, deploy, cancellazioni), **mostrare il piano e attendere l'ok**.
Non creare risorse remote senza conferma esplicita dei nomi.

## Documentazione Astro

Documentazione completa: https://docs.astro.build — vedere anche `AGENTS.md`.
