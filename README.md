# Volley Scout PWA

Applicazione PWA per la gestione di **una o più squadre di pallavolo**: rosa dei
giocatori, calendario partite e statistiche.

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
- **Calendario**: CRUD partite (data, orario, avversario, luogo),
  ordinamento per data, evidenziazione delle gare passate, import/export JSON
- **Impostazioni**: tema (scuro/chiaro/sistema), backup completo
  (squadre + rosa + calendario) in un unico file JSON, ripristino del tema
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
