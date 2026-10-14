import { readJSON, writeJSON } from '../lib/storage.js';

const STORAGE_KEY = 'giocatori';

/** Prima lettera maiuscola di ogni parola. */
function capitalize(str) {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Normalizza il giocatore prima del salvataggio (minuscolo, trim). */
function normalizeGiocatore(giocatore) {
  return {
    ...giocatore,
    nome: String(giocatore.nome ?? '').toLowerCase().trim(),
    cognome: String(giocatore.cognome ?? '').toLowerCase().trim(),
    numeroMaglia: Number(giocatore.numeroMaglia),
    ruolo: String(giocatore.ruolo ?? '').toLowerCase().trim(),
  };
}

/** Prepara il giocatore per la visualizzazione. */
function formatGiocatore(giocatore) {
  return {
    ...giocatore,
    nome: capitalize(giocatore.nome ?? ''),
    cognome: capitalize(giocatore.cognome ?? ''),
    ruolo: capitalize(giocatore.ruolo ?? ''),
  };
}

/** Lista ordinata per numero di maglia, pronta per la visualizzazione. */
export function getGiocatori() {
  const giocatori = readJSON(STORAGE_KEY, []);
  const list = Array.isArray(giocatori) ? giocatori : [];
  return list.map(formatGiocatore).sort((a, b) => a.numeroMaglia - b.numeroMaglia);
}

/** Salva la rosa completa (normalizzata e ordinata per maglia). */
export function setGiocatori(giocatori) {
  const list = Array.isArray(giocatori) ? giocatori : [];
  const normalized = list
    .map(normalizeGiocatore)
    .sort((a, b) => a.numeroMaglia - b.numeroMaglia);
  writeJSON(STORAGE_KEY, normalized);
}
