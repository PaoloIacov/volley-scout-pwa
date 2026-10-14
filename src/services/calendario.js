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

/**
 * Lista ordinata per data crescente, pronta per la visualizzazione.
 * Ogni voce include `dataISO` (per i confronti) oltre ai campi formattati.
 */
export function getPartite() {
  const partite = readJSON(STORAGE_KEY, []);
  const list = Array.isArray(partite) ? partite : [];
  return list
    .map((p) => ({ ...formatPartita(p), dataISO: toISO(p.data) }))
    .sort((a, b) => parseDate(a.dataISO).getTime() - parseDate(b.dataISO).getTime());
}

/** Salva l'intero calendario (normalizzato e ordinato per data). */
export function setPartite(partite) {
  const list = Array.isArray(partite) ? partite : [];
  const normalized = list
    .map(normalizePartita)
    .sort((a, b) => parseDate(a.data).getTime() - parseDate(b.data).getTime());
  writeJSON(STORAGE_KEY, normalized);
}
