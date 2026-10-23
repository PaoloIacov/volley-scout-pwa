import { readJSON, writeJSON } from '../lib/storage.js';

const STORAGE_KEY = 'giocatori';

/** Identificativo univoco (con fallback dove crypto.randomUUID non esiste). */
function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Prima lettera maiuscola di ogni parola. */
function capitalize(str) {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Normalizza il giocatore prima del salvataggio (minuscolo, trim).
 * Conserva l'identificativo esistente: serve a collegare il profilo alle
 * statistiche e a non perdere il riferimento quando si modifica un giocatore.
 */
function normalizeGiocatore(giocatore) {
  return {
    ...giocatore,
    id: giocatore.id ? String(giocatore.id) : newId(),
    nome: String(giocatore.nome ?? '').toLowerCase().trim(),
    cognome: String(giocatore.cognome ?? '').toLowerCase().trim(),
    numeroMaglia: Number(giocatore.numeroMaglia),
    ruolo: String(giocatore.ruolo ?? '').toLowerCase().trim(),
    /** Foto profilo caricata dal dispositivo (data URL). */
    foto: String(giocatore.foto ?? ''),
  };
}

/** Prepara il giocatore per la visualizzazione. */
function formatGiocatore(giocatore) {
  return {
    ...giocatore,
    nome: capitalize(giocatore.nome ?? ''),
    cognome: capitalize(giocatore.cognome ?? ''),
    ruolo: capitalize(giocatore.ruolo ?? ''),
    foto: giocatore.foto ?? '',
  };
}

/**
 * Tutti i giocatori salvati. Le rose create prima dell'introduzione del
 * profilo non hanno un id: viene generato e salvato al primo accesso, così
 * ogni giocatore ha un riferimento stabile.
 */
function tutti() {
  const raw = readJSON(STORAGE_KEY, []);
  const lista = Array.isArray(raw) ? raw.filter(Boolean) : [];
  let mancanoId = false;
  const conId = lista.map((giocatore) => {
    if (giocatore.id) return giocatore;
    mancanoId = true;
    return { ...giocatore, id: newId() };
  });
  if (mancanoId) writeJSON(STORAGE_KEY, conId);
  return conId;
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

/** Singolo giocatore per id, oppure `null`. */
export function getGiocatore(id) {
  if (!id) return null;
  const trovato = tutti().find((giocatore) => String(giocatore.id) === String(id));
  return trovato ? formatGiocatore(trovato) : null;
}

/**
 * Aggiorna i dati anagrafici di un giocatore (id, nome, cognome, numero,
 * ruolo e foto). Restituisce il giocatore aggiornato, o `null` se non esiste.
 */
export function aggiornaGiocatore(id, dati) {
  const lista = tutti();
  const index = lista.findIndex((giocatore) => String(giocatore.id) === String(id));
  if (index < 0) return null;
  const aggiornato = normalizeGiocatore({ ...lista[index], ...dati, id: lista[index].id });
  lista[index] = aggiornato;
  writeJSON(STORAGE_KEY, lista);
  return formatGiocatore(aggiornato);
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
