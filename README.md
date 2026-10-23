# Volley Scout PWA

Applicazione PWA per la gestione di **una o più squadre di pallavolo**: rosa dei
giocatori, calendario partite, scout delle gare e statistiche.

Riscritta completamente in **React** (Vite + Tailwind CSS v4), con interfaccia
moderna, uniforme e responsive (tab bar dedicata su mobile), tema chiaro/scuro
e design system a token condivisi.

## Stack

- **React 19** + **Vite 8** — build e dev server rapidi
- **React Router 7** (Hash Router: funziona senza configurazione del server, ideale per GitHub Pages)
- **Tailwind CSS v4** (`@tailwindcss/vite`) — design system a utility class
- **lucide-react** — icone uniformi
- **vite-plugin-pwa** — manifest + service worker (Workbox) per l'installazione offline
- Dati salvati in **localStorage** (nessun backend)

## Funzionalità

- **Squadre**: CRUD squadre multiple (nome, club, stagione, foto di copertina
  caricata o da URL), selezione della squadra attiva; ogni squadra ha la sua
  rosa e il suo calendario, eliminando la squadra vengono eliminati anche i dati
  associati. Al primo avvio i dati preesistenti vengono migrati alla prima squadra
- **Home**: hero della squadra attiva, statistiche rapide, prossima partita
- **Rosa**: CRUD giocatori (nome, cognome, numero maglia, ruolo),
  validazione dei campi, import/export JSON
- **Calendario**: CRUD partite (data, orario, avversario, luogo, tipo
  campionato/amichevole), ordinamento per data, evidenziazione delle gare
  passate, import/export JSON
- **Scout**: rilevamento statistico delle partite, creato dalla Home o dal
  pulsante su ogni partita del calendario (dati precompilati, incluso il tipo
  di gara) oppure da zero scegliendo esplicitamente campionato o amichevole.
  In campionato i convocati sono al massimo 14 (12 di movimento + 2 liberi);
  in amichevole non c'è limite e viene preselezionata tutta la rosa. La
  schermata è touch friendly, con punteggio del set sempre visibile e
  modificabile (+/- o a tastiera) e senza tetto a 25: oltre al set point
  compaiono vantaggio e set concluso (tie-break a 15 nel quinto set).
  L'inserimento è rapido: giocatore → azione (ricezione, attacco, muro,
  battuta) → esito (# perfetta, + positiva, - negativa, = errore). Il `#`
  assegna un punto solo per attacco, muro e battuta (la ricezione perfetta non
  muove il punteggio), mentre `=` assegna sempre un punto all'avversario;
  annulla/rimuovi riportano indietro il punto.
  A ogni set, compreso il primo appena creato, si scelgono i 7 titolari (6 di
  movimento + 1 libero), mostrati in cima al riepilogo con il libero in fondo.
  Nel riepilogo non si trascina più: il pulsante accanto al giocatore apre la
  sostituzione con la panchina, mantenendo il vincolo 6 + 1. La tabella mostra
  solo i 7 titolari del set attivo, con i numeri legati al set selezionato:
  cambiando set dalla barra del punteggio (o aggiungendone uno nuovo) i dati si
  aggiornano. La tab Totali
  replica la suddivisione Ricezione / Attacco / Muro / Battuta per tutti i
  convocati e aggiunge, per ogni giocatore, Punti fatti (i `#` di attacco, muro
  e battuta), Errori fatti (tutti i `=`) e Palloni attaccati (tutte le azioni di
  attacco). Il selettore Partita / Set N e la matrice mostrano i dati
  dell'intera partita e dei singoli set. Punteggio, tab e "Annulla ultimo"
  restano sticky; le label delle azioni hanno contrasto e separatori più
  marcati e l'intestazione della tabella è sticky. Le sostituzioni funzionano
  anche nella tab Inserimento,
  toccando un giocatore in campo e poi uno in panchina. Ci sono poi i tasti
  "Errore generico" (punto all'avversario) e "Errore avversario" (punto a noi):
  vengono contati a parte senza toccare le statistiche dei giocatori, così nel
  riepilogo si vede anche quanti dei nostri punti derivano da errori avversari
  (con percentuale sul totale). I set si aggiungono ma anche si
  eliminano dall'elenco in alto (con conferma se contengono dati). I liberi
  hanno card riconoscibili e non registrano battuta né muro; i dati vengono
  salvati a ogni tocco, si può uscire e rientrare senza perdere nulla. Dalla
  tab Riepilogo si scoutizza anche toccando direttamente le celle
  (giocatore × azione × esito).
- **Export scout**: dalle tab Riepilogo e Totali si esporta il riepilogo
  sintetico (info partita e tipo di gara, punteggi dei set, tabella per
  giocatore con sotto-colonne di esito colorate, Tot compreso, errori generici
  e punti da errori avversari) in Excel (.xlsx) o PDF: le librerie di export
  vengono caricate solo al momento del download
- **Impostazioni**: tema (scuro/chiaro/sistema), backup completo
  (squadre + rosa + calendario + scout) in un unico file JSON, ripristino del tema
- **PWA**: installabile, utilizzabile offline (i dati restano nel dispositivo)

## Sviluppo

```bash
npm install
npm run dev        # server di sviluppo su http://localhost:5173
npm run build      # build di produzione in dist/
npm run preview    # anteprima della build di produzione
```

## Deploy

Il workflow GitHub Actions `.github/workflows/deploy.yml` esegue `npm run build`
e pubblica `dist/` su GitHub Pages a ogni push su `main`.
In produzione l'app vive sotto `/volley-scout-pwa/` (base path impostata in
`vite.config.js`).

## Struttura

```
src/
├── components/   # Layout, Toast, SettingsContext, elementi di UI riusabili
├── forms/        # Form modali con validazione (squadra, giocatore, partita)
├── hooks/        # useForm (validazione touched/submit), useSquadre (reattività)
├── lib/          # storage, date, immagini, import/export JSON
├── pages/        # Home, Squadre, Squadra (rosa), Calendario, Impostazioni
└── services/     # accesso ai dati (localStorage) con normalizzazione
```
