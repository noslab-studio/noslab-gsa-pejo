# Ripartenza del lavoro

Prompt di base da incollare in una nuova sessione di Claude Code per riprendere il lavoro sul
sito. Il repository è pubblico, quindi qui ci sono solo regole e trappole: lo stato del
lavoro, le variabili d'ambiente e i compiti aperti stanno nella versione completa, fuori dal
repo, in `~/Lavoro/siti web clienti NosLab/noslab-gsa-pejo-ripartenza/` (prompt, memoria di
progetto e prove locali).

```text
Riprendiamo il lavoro sul sito di Simona (noslab-gsa-pejo, in produzione su https://gsa-pejo.com).
Cartella: ~/Lavoro/siti web clienti NosLab/noslab-gsa-pejo. NON usare ~/Lavoro/noslab-gsa-pejo: è una copia vecchia, ferma a luglio.
Prima di muoverti leggi CLAUDE.md e la memoria di progetto: soprattutto lavoro-in-corso, chatbot-ai, qualita-sicurezza-sito ed elenco-lead-follow-up. Se la memoria non c'è, è in ~/Lavoro/siti web clienti NosLab/noslab-gsa-pejo-ripartenza/memoria/, con RIPARTENZA.md, le istruzioni di ripristino e il prompt completo con lo stato aggiornato.

Regole ferme: mai `netlify deploy --prod` da CLI né `restoreSiteDeploy` (skill rilascio-netlify-sicuro). Lighthouse si misura solo in produzione. Conventional commits, branch, PR, deploy preview, merge. Testi in italiano, niente em-dash. Prima di ogni azione remota o distruttiva, mostrare il piano e aspettare l'ok di Cristian. Il merge di una PR solo su richiesta esplicita di Cristian per quella PR; se il classificatore dei permessi lo blocca, non aggirarlo. Liberatoria, consensi della galleria e dati personali nel prompt del chatbot aspettano decisioni di Simona o di un legale: non toccarli. Il repository è pubblico: niente segreti, dati personali o stato delle variabili d'ambiente nei file e nelle PR. Rispondi sempre in italiano.

## Prima di lavorare

- git pull su main.
- Netlify CLI senza netlify link: passare NETLIFY_SITE_ID (è nella versione completa del prompt).

## Trappole

- Lighthouse sui deploy preview non fa testo (noindex di Netlify e barra bloccata dalla CSP).
- I limiti del chatbot non si provano dalla rete di Cristian (l'IP di uscita cambia): prove locali con Blobs simulato.
- Gli header di netlify.toml non arrivano alle Functions: vanno messi nelle risposte delle funzioni.
- Non riattivare compressHTML.
- astro build fallisce dentro .claude/worktrees/ (il punto nel percorso): usare un worktree in una cartella senza punti e copiare node_modules con cp -cR.
- Le pagine legali sono noindex per scelta: SEO sotto 95 lì va bene.
- Una variabile nuova su Netlify arriva alle Functions solo con il deploy successivo.
- Animazioni di comparsa (classe reveal) mai sugli elementi della prima schermata: ritardano l'LCP.

Al 95% del contesto: aggiorna la memoria, la sua copia e il prompt completo prima di ripartire.
```
