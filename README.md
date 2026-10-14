# Volley Scout PWA

Applicazione PWA per la gestione della **1DM Albano Circo**: rosa dei giocatori,
calendario partite e appuntamenti settimanali.

Riscritta completamente in **React** (Vite + Tailwind CSS v4), con interfaccia
scuro moderna, uniforme e responsive (tab bar dedicata su mobile).

## Stack

- **React 19** + **Vite 8** — build e dev server rapidi
- **React Router 7** (Hash Router: funziona senza configurazione del server, ideale per GitHub Pages)
- **Tailwind CSS v4** (`@tailwindcss/vite`) — design system a utility class
- **lucide-react** — icone uniformi
- **vite-plugin-pwa** — manifest + service worker (Workbox) per l'installazione offline
- Dati salvati in **localStorage** (nessun backend)

## Funzionalità

- **Home**: hero della squadra, statistiche rapide, orari di allenamento,
  prossima partita, sede ufficiale con link a Google Maps
- **Squadra**: CRUD giocatori (nome, cognome, numero maglia, ruolo),
  validazione dei campi, import/export JSON
- **Calendario**: CRUD partite (data, orario, avversario, luogo),
  ordinamento per data, evidenziazione delle gare passate, import/export JSON
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
├── components/   # Layout, Toast, elementi di UI riusabili (Modal, Button, Card…)
├── forms/        # Form modali con validazione (giocatore, partita)
├── hooks/        # useForm (validazione touched/submit)
├── lib/          # storage, date, import/export JSON
├── pages/        # Home, Squadra, Calendario
└── services/     # accesso ai dati (localStorage) con normalizzazione
```
