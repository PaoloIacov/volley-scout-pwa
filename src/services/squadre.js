import { readJSON, writeJSON } from '../lib/storage.js';
import { TEMI } from './impostazioni.js';

const STORAGE_KEY = 'squadre';
const ACTIVE_KEY = 'squadraAttiva';
const GIOCATORI_KEY = 'giocatori';
const PARTITE_KEY = 'partite';
const SCOUT_KEY = 'scout';
const IMPOSTAZIONI_KEY = 'impostazioni';

/** Identificativo univoco (con fallback dove crypto.randomUUID non esiste). */
function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Testo trimmato, o stringa vuota. */
function text(value) {
  return String(value ?? '').trim();
}

function isList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

/** Normalizza la squadra prima del salvataggio. */
function normalizeSquadra(squadra) {
  return {
    id: squadra?.id ? String(squadra.id) : newId(),
    nome: text(squadra?.nome),
    club: text(squadra?.club),
    stagione: text(squadra?.stagione),
    /** Immagine caricata dal dispositivo (data URL). */
    foto: text(squadra?.foto),
    /** URL esterno, usato se `foto` è vuoto. */
    fotoUrl: text(squadra?.fotoUrl),
  };
}

/* Notifiche: header e pagine si aggiornano quando cambiano le squadre. */
let versione = 0;
const ascoltatori = new Set();

export function subscribeSquadre(ascoltatore) {
  ascoltatori.add(ascoltatore);
  return () => ascoltatori.delete(ascoltatore);
}

export function getVersioneSquadre() {
  return versione;
}

function notifica() {
  versione += 1;
  ascoltatori.forEach((ascoltatore) => ascoltatore());
}

/** Tutte le squadre registrate, nell'ordine di inserimento. */
export function getSquadre() {
  return isList(readJSON(STORAGE_KEY, [])).map(normalizeSquadra);
}

/** Sostituisce l'elenco squadre (usato dall'import del backup). */
export function setSquadre(squadre) {
  const list = isList(squadre).map(normalizeSquadra);
  writeJSON(STORAGE_KEY, list);
  notifica();
  return list;
}

/** Singola squadra per id, oppure `null`. */
export function getSquadra(id) {
  if (!id) return null;
  return getSquadre().find((squadra) => squadra.id === id) ?? null;
}

/**
 * Squadra attiva: quella selezionata dall'utente, in alternativa
 * la prima disponibile. `null` se non esiste ancora nessuna squadra.
 */
export function getSquadraAttiva() {
  const squadre = getSquadre();
  if (squadre.length === 0) return null;
  const id = readJSON(ACTIVE_KEY, null);
  return squadre.find((squadra) => squadra.id === id) ?? squadre[0];
}

/** Seleziona la squadra attiva. */
export function setSquadraAttiva(id) {
  writeJSON(ACTIVE_KEY, id ?? null);
  notifica();
}

/**
 * Immagine di copertina della squadra: foto caricata o URL, oppure stringa
 * vuota (la UI mostra allora un motivo grafico generico).
 */
export function fotoSquadra(squadra) {
  return squadra?.foto || squadra?.fotoUrl || '';
}

/**
 * Inserisce o aggiorna una squadra; restituisce la voce salvata.
 * Creando la prima squadra, i dati preesistenti senza squadra (rosa e
 * calendario) vengono adottati da essa.
 */
export function salvaSquadra(squadra) {
  const normalized = normalizeSquadra(squadra);
  const list = getSquadre();
  const index = list.findIndex((voce) => voce.id === normalized.id);
  const isPrimaSquadra = index < 0 && list.length === 0;

  if (index >= 0) list[index] = normalized;
  else list.push(normalized);

  writeJSON(STORAGE_KEY, list);
  // La prima squadra creata diventa automaticamente quella attiva.
  if (!readJSON(ACTIVE_KEY, null)) writeJSON(ACTIVE_KEY, normalized.id);

  if (isPrimaSquadra) assegnaOrfani(normalized.id);

  notifica();
  return normalized;
}

/** Numero di giocatori, partite e scout associati a una squadra. */
export function contaDatiSquadra(id) {
  return {
    giocatori: isList(readJSON(GIOCATORI_KEY, [])).filter((g) => g.squadraId === id).length,
    partite: isList(readJSON(PARTITE_KEY, [])).filter((p) => p.squadraId === id).length,
    scout: isList(readJSON(SCOUT_KEY, [])).filter((s) => s.squadraId === id).length,
  };
}

/**
 * Elimina la squadra e tutti i dati associati (rosa, calendario e scout).
 * La squadra attiva passa alla successiva disponibile.
 */
export function rimuoviSquadra(id) {
  writeJSON(
    STORAGE_KEY,
    getSquadre().filter((squadra) => squadra.id !== id),
  );
  writeJSON(
    GIOCATORI_KEY,
    isList(readJSON(GIOCATORI_KEY, [])).filter((giocatore) => giocatore.squadraId !== id),
  );
  writeJSON(
    PARTITE_KEY,
    isList(readJSON(PARTITE_KEY, [])).filter((partita) => partita.squadraId !== id),
  );
  writeJSON(
    SCOUT_KEY,
    isList(readJSON(SCOUT_KEY, [])).filter((scout) => scout.squadraId !== id),
  );
  writeJSON(ACTIVE_KEY, getSquadraAttiva()?.id ?? null);
  notifica();
}

/** Assegna alla squadra indicata i giocatori, le partite e gli scout rimasti senza squadra. */
function assegnaOrfani(squadraId) {
  if (!squadraId) return;
  const giocatori = isList(readJSON(GIOCATORI_KEY, []));
  const partite = isList(readJSON(PARTITE_KEY, []));
  const scouts = isList(readJSON(SCOUT_KEY, []));
  const orfaniG = giocatori.some((giocatore) => !giocatore.squadraId);
  const orfaniP = partite.some((partita) => !partita.squadraId);
  const orfaniS = scouts.some((scout) => !scout.squadraId);
  if (!orfaniG && !orfaniP && !orfaniS) return;

  writeJSON(
    GIOCATORI_KEY,
    giocatori.map((g) => (g.squadraId ? g : { ...g, squadraId })),
  );
  writeJSON(
    PARTITE_KEY,
    partite.map((p) => (p.squadraId ? p : { ...p, squadraId })),
  );
  writeJSON(
    SCOUT_KEY,
    scouts.map((s) => (s.squadraId ? s : { ...s, squadraId })),
  );
}

/**
 * Migrazione dei dati scritti prima dell'introduzione delle squadre multiple:
 * 1. l'identità salvata nelle vecchie impostazioni (club, squadra, stagione,
 *    foto) diventa la prima squadra;
 * 2. rosa e calendario senza `squadraId` vengono assegnati alla squadra attiva;
 * 3. nelle impostazioni resta solo il tema.
 */
export function migraDati() {
  const raw = readJSON(IMPOSTAZIONI_KEY, null);
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : null;
  const giocatori = isList(readJSON(GIOCATORI_KEY, []));
  const partite = isList(readJSON(PARTITE_KEY, []));
  const scouts = isList(readJSON(SCOUT_KEY, []));
  const haOrfani =
    giocatori.some((g) => !g.squadraId) ||
    partite.some((p) => !p.squadraId) ||
    scouts.some((s) => !s.squadraId);

  let attiva = getSquadraAttiva();

  const identita = source
    ? {
        nome: text(source.squadra),
        club: text(source.club),
        stagione: text(source.stagione),
        foto: text(source.foto),
        fotoUrl: text(source.fotoUrl),
      }
    : null;
  const haIdentita = identita && Object.values(identita).some((value) => value !== '');

  // Primo avvio con l'identità ancora nelle impostazioni: crea la squadra.
  if (!attiva && haIdentita) {
    attiva = salvaSquadra(identita);
    setSquadraAttiva(attiva.id);
  }

  if (attiva && haOrfani) assegnaOrfani(attiva.id);

  // Le impostazioni precedenti contenevano identità, sede e allenamenti:
  // da qui in poi resta solo il tema.
  if (source && Object.keys(source).some((key) => key !== 'tema')) {
    writeJSON(IMPOSTAZIONI_KEY, { tema: TEMI.includes(source.tema) ? source.tema : 'sistema' });
  }
}
