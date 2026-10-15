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

function tutti() {
  const giocatori = readJSON(STORAGE_KEY, []);
  return Array.isArray(giocatori) ? giocatori.filter(Boolean) : [];
}

/**
 * Rosa di una squadra, ordinata per numero di maglia e pronta per la
 * visualizzazione.
 */
export function getGiocatori(squadraId) {
  return tutti()
    .filter((giocatore) => giocatore.squadraId === squadraId)
    .map(formatGiocatore)
    .sort((a, b) => a.numeroMaglia - b.numeroMaglia);
}

/**
 * Salva la rosa della squadra: i giocatori delle altre squadre restano
 * invariati, quelli della squadra indicata vengono sostituiti.
 */
export function setGiocatori(squadraId, giocatori) {
  const list = Array.isArray(giocatori) ? giocatori : [];
  const normalized = [
    ...tutti().filter((giocatore) => giocatore.squadraId !== squadraId),
    ...list.map((giocatore) => ({ ...normalizeGiocatore(giocatore), squadraId })),
  ].sort((a, b) => a.numeroMaglia - b.numeroMaglia);
  writeJSON(STORAGE_KEY, normalized);
}

/** Rosa di tutte le squadre (usata dal backup completo). */
export function getTuttiGiocatori() {
  return tutti()
    .map(formatGiocatore)
    .sort((a, b) => a.numeroMaglia - b.numeroMaglia);
}

/** Sostituisce l'intera rosa di tutte le squadre (usata dall'import del backup). */
export function setTuttiGiocatori(giocatori) {
  const list = Array.isArray(giocatori) ? giocatori : [];
  const normalized = list
    .filter(Boolean)
    .map(normalizeGiocatore)
    .sort((a, b) => a.numeroMaglia - b.numeroMaglia);
  writeJSON(STORAGE_KEY, normalized);
}
