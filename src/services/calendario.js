import { readJSON, writeJSON } from '../lib/storage.js';
import { parseDate, toISO, toItalianDate } from '../lib/dates.js';

const STORAGE_KEY = 'partite';

/** Prima lettera maiuscola di ogni parola. */
function capitalize(str) {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Normalizza la partita prima del salvataggio (minuscolo, trim, data ISO). */
function normalizePartita(partita) {
  return {
    ...partita,
    avversario: String(partita.avversario ?? '').toLowerCase().trim(),
    luogo: String(partita.luogo ?? '').toLowerCase().trim(),
    data: toISO(partita.data),
    orarioInizio: String(partita.orarioInizio ?? '').trim(),
    tipo: partita.tipo === 'amichevole' ? 'amichevole' : 'campionato',
  };
}

/** Prepara la partita per la visualizzazione (data in formato italiano). */
function formatPartita(partita) {
  return {
    ...partita,
    avversario: capitalize(partita.avversario ?? ''),
    luogo: capitalize(partita.luogo ?? ''),
    data: toItalianDate(partita.data),
  };
}

function tutte() {
  const partite = readJSON(STORAGE_KEY, []);
  return Array.isArray(partite) ? partite.filter(Boolean) : [];
}

/**
 * Calendario di una squadra, ordinato per data crescente e pronto per la
 * visualizzazione. Ogni voce include `dataISO` (per i confronti) oltre ai
 * campi formattati.
 */
export function getPartite(squadraId) {
  return tutte()
    .filter((partita) => partita.squadraId === squadraId)
    .map((p) => ({ ...formatPartita(p), dataISO: toISO(p.data) }))
    .sort((a, b) => parseDate(a.dataISO).getTime() - parseDate(b.dataISO).getTime());
}

/**
 * Salva il calendario della squadra: le partite delle altre squadre restano
 * invariate, quelle della squadra indicata vengono sostituite.
 */
export function setPartite(squadraId, partite) {
  const list = Array.isArray(partite) ? partite : [];
  const normalized = [
    ...tutte().filter((partita) => partita.squadraId !== squadraId),
    ...list.map((partita) => ({ ...normalizePartita(partita), squadraId })),
  ].sort((a, b) => parseDate(a.data).getTime() - parseDate(b.data).getTime());
  writeJSON(STORAGE_KEY, normalized);
}

/** Calendario di tutte le squadre (usato dal backup completo). */
export function getTuttePartite() {
  return tutte()
    .map((p) => ({ ...formatPartita(p), dataISO: toISO(p.data) }))
    .sort((a, b) => parseDate(a.dataISO).getTime() - parseDate(b.dataISO).getTime());
}

/** Sostituisce l'intero calendario di tutte le squadre (usato dall'import del backup). */
export function setTuttePartite(partite) {
  const list = Array.isArray(partite) ? partite : [];
  const normalized = list
    .filter(Boolean)
    .map(normalizePartita)
    .sort((a, b) => parseDate(a.data).getTime() - parseDate(b.data).getTime());
  writeJSON(STORAGE_KEY, normalized);
}
