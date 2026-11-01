# Ripartenza del lavoro (1/11/2026)

Prompt da incollare in una nuova sessione di Claude Code per riprendere il lavoro sul sito. La versione completa, con la memoria di progetto e le prove locali, è fuori dal repo (che è pubblico): `~/Lavoro/siti web clienti NosLab/noslab-gsa-pejo-ripartenza/`.

```text
Riprendiamo il lavoro sul sito di Simona (noslab-gsa-pejo, in produzione su https://gsa-pejo.com).
Cartella: ~/Lavoro/siti web clienti NosLab/noslab-gsa-pejo. NON usare ~/Lavoro/noslab-gsa-pejo: è una copia vecchia, ferma a luglio.
Prima di muoverti leggi CLAUDE.md e la memoria di progetto, aggiornata al 1/11/2026: soprattutto lavoro-in-corso, chatbot-ai, qualita-sicurezza-sito ed elenco-lead-follow-up. Se la memoria non c'è, è in ~/Lavoro/siti web clienti NosLab/noslab-gsa-pejo-ripartenza/memoria/, con RIPARTENZA.md e le istruzioni di ripristino. Una copia di questo prompt è anche in docs/ripartenza.md nel repository.

Regole ferme: mai `netlify deploy --prod` da CLI né `restoreSiteDeploy` (skill rilascio-netlify-sicuro). Lighthouse si misura solo in produzione. Conventional commits, branch, PR, deploy preview, merge. Testi in italiano, niente em-dash. Prima di ogni azione remota o distruttiva, mostrare il piano e aspettare l'ok di Cristian. Il merge di una PR solo su richiesta esplicita di Cristian per quella PR; se il classificatore dei permessi lo blocca, non aggirarlo. Liberatoria, consensi della galleria e dati personali nel prompt del chatbot aspettano decisioni di Simona o di un legale: non toccarli. Il repository è pubblico: niente segreti né dati personali nei file e nelle PR. Rispondi sempre in italiano.

## Stato al 1/11/2026, 04:30 UTC

- main = e0ebd9d (merge della PR #22, 31/10 alle 21:35 UTC). Deploy di produzione da Git pubblicato e verificato.
- PR #19 (audit, priorità basse) unita il 31/10 e verificata. Lighthouse in produzione il 31/10 sera: home, chi-sono, servizi, fotografia e contatti 100 in tutte le categorie su mobile e desktop, tranne Performance 99 su home e fotografia mobile.
- PR #22 unita: il chatbot conosce NosLab per intero (bottega digitale alpina del Trentino, Terzolas, Founder e CEO Cristian Bresadola, motto, lavori: Corte dei Toldi, El Brenz, Valli del Noce) e a «con chi fa i siti Simona?» risponde sempre NosLab. Verificato in produzione. Punto Riflesso nel prompt non è nominato, di proposito. Se manca il token del gateway il visitatore riceve i contatti di Simona e la funzione scrive console.error.
- Il 31/10 alle 12:37 UTC il chatbot ha risposto «Assistente non ancora configurato» a Simona: in quella chiamata mancava ANTHROPIC_API_KEY (token dell'AI Gateway di Netlify). Causa non chiarita (ipotesi: passaggio del team a Pro lo stesso giorno). Se ricapita, cercare «ANTHROPIC_API_KEY assente» nei registri della funzione chat.
- Verifiche del 1/11 chiuse: pulizia-chat alle 03:15 UTC «cancellate 102 chiavi su 102» (primo del mese: sparite anche le chiavi del mese di ottobre, corretto); chiavi del vecchio formato con l'IP in chiaro: 0.

## PR aperte (niente merge senza richiesta esplicita di Cristian)

1. #20 feat/chatbot-haiku-5-5: Haiku 5.5 con thinking disabled, circa 8 volte più economico. Controlli verdi, preview ok, nessun conflitto con main dopo la #22 (da ricontrollare con gh pr view 20). Decisione aperta con Simona: la regola «sempre in italiano» non tiene (sul preview, a una domanda in inglese, risposta in inglese 1 volta su 3); per i turisti stranieri si consiglia di rispondere nella lingua di chi scrive. Dopo il merge: Cristian cambia o cancella CHAT_MODEL (oggi claude-haiku-4-5 in tutti i contesti), poi nuovo deploy da Git.
2. #21 fix/chat-segreto-stabile: impronte dei visitatori e firme dei turni con CHAT_SEGRETO, il token del gateway come ripiego (che cambia ogni 2 ore: oggi le firme scadono a metà conversazione e il limite per visitatore si azzera). Senza la variabile si comporta come oggi. Prove locali 2 su 2 (prova-segreto-chat) e 5 su 5 (prova-tetto-chat), nella cartella di ripartenza, prove/. Dopo il merge: Cristian imposta CHAT_SEGRETO su Netlify, poi nuovo deploy da Git. Il suo worktree è nello scratchpad di una sessione chiusa: se serve, ricrearlo da origin/fix/chat-segreto-stabile.

## Cose che deve fare Cristian a mano (ricordagliele se non risultano fatte)

- LEAD_ADMIN_TOKEN su Netlify, poi nuovo deploy da Git (al 31/10 le variabili erano solo BUILD_HOOK_URL, CHAT_MODEL, LEAD_WEBHOOK_TOKEN, NODE_VERSION, SITE_URL).
- CHAT_SEGRETO su Netlify dopo il merge della #21.
- Controllare la spesa del chatbot nei crediti Netlify (AI Gateway; la console Anthropic non c'entra).
- Eliminare da /api/contatti il contatto di prova «Mario Rossi (PROVA NosLab)».
- Dare l'ok per togliere i worktree superati: exciting-kapitsa-9e1ef1 (branch locale chore/lint-verde, mai pushato) e newsletter-chatbot-punto-riflesso-2da2b2 (da controllare prima) nella cartella giusta; ripresa-gsa-pejo-b22888 nella copia vecchia.

## Prima di lavorare

- La copia locale di main è ferma a 897a0f2: fare git pull (origin/main è e0ebd9d).
- Netlify CLI senza netlify link: NETLIFY_SITE_ID=563fba96-ab08-4d85-a54f-e96dddf47dcf.

## Trappole

- Lighthouse sui deploy preview non fa testo (noindex di Netlify e barra bloccata dalla CSP).
- I limiti del chatbot non si provano dalla rete di Cristian (l'IP di uscita cambia): prove locali con Blobs simulato.
- Gli header di netlify.toml non arrivano alle Functions.
- Non riattivare compressHTML.
- astro build fallisce dentro .claude/worktrees/ (il punto nel percorso): usare un worktree in una cartella senza punti e copiare node_modules con cp -cR.
- Le pagine legali sono noindex per scelta: SEO sotto 95 lì va bene.
- Una variabile nuova su Netlify arriva alle Functions solo con il deploy successivo.

Al 95% del contesto: aggiorna la memoria, la sua copia e questo prompt prima di ripartire.
```
