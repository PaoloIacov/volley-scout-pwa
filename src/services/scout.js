import { readJSON, writeJSON } from '../lib/storage.js';
import { toISO } from '../lib/dates.js';
import { isAzione, isEsito } from '../lib/scout-stats.js';

const STORAGE_KEY = 'scout';

/** Numero massimo di set tracciabili in una partita. */
export const SET_MASSIMO = 5;

/** Identificativo univoco (con fallback dove crypto.randomUUID non esiste). */
function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function num(value, max = 999) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), max);
}

function normalizeAzione(voce) {
  if (!voce || !num(voce.numero)) return null;
  if (!isAzione(voce.azione) || !isEsito(voce.esito)) return null;
  return {
    id: voce.id ? String(voce.id) : newId(),
    ts: Number(voce.ts) || Date.now(),
    set: Math.max(1, Number(voce.set) || 1),
    numero: num(voce.numero),
    azione: voce.azione,
    esito: voce.esito,
  };
}

function normalizeSet(voce, indice) {
  return {
    n: Math.max(1, Number(voce?.n) || indice + 1),
    nostro: num(voce?.nostro),
    loro: num(voce?.loro),
  };
}

/** Normalizza il record scout prima del salvataggio. */
function normalizeScout(scout) {
  const sets = isList(scout?.sets).map(normalizeSet);
  return {
    id: scout?.id ? String(scout.id) : newId(),
    squadraId: scout?.squadraId ?? '',
    /** Data della gara in ISO. */
    data: toISO(scout?.data) || '',
    orarioInizio: String(scout?.orarioInizio ?? '').trim(),
    avversario: String(scout?.avversario ?? '').trim(),
    luogo: String(scout?.luogo ?? '').trim(),
    /** Quale delle due squadre si sta osservando. */
    squadraOsservata: scout?.squadraOsservata === 'avversaria' ? 'avversaria' : 'propria',
    setCorrente: Math.max(1, Number(scout?.setCorrente) || 1),
    sets: sets.length > 0 ? sets : [normalizeSet(null, 0)],
    azioni: isList(scout?.azioni).map(normalizeAzione).filter(Boolean),
    /** Numeri aggiunti manualmente oltre alla rosa. */
    numeriExtra: [
      ...new Set(
        isList(scout?.numeriExtra)
          .map((n) => num(n))
          .filter((n) => n > 0),
      ),
    ],
    aggiornato: Number(scout?.aggiornato) || Date.now(),
  };
}

function tutti() {
  return isList(readJSON(STORAGE_KEY, []));
}

/** Scout della squadra, ordinati per data decrescente (poi per ultimo aggiornamento). */
export function getScoutList(squadraId) {
  return tutti()
    .filter((scout) => scout.squadraId === squadraId)
    .map((scout) => normalizeScout(scout))
    .sort((a, b) => b.data.localeCompare(a.data) || b.aggiornato - a.aggiornato);
}

/** Singolo scout per id, oppure `null`. */
export function getScout(id) {
  if (!id) return null;
  const found = tutti().find((scout) => scout.id === id);
  return found ? normalizeScout(found) : null;
}

/** Crea e salva un nuovo scout, restituendo il record pronto. */
export function creaScout(dati) {
  const scout = normalizeScout({ ...dati, id: undefined, azioni: [], sets: null });
  const list = tutti();
  list.push(scout);
  writeJSON(STORAGE_KEY, list);
  return scout;
}

/** Sostituisce lo scout per id (o lo accoda se mancante), con timestamp aggiornato. */
export function salvaScout(scout) {
  const normalized = normalizeScout({ ...scout, aggiornato: Date.now() });
  const list = tutti();
  const index = list.findIndex((voce) => voce.id === normalized.id);
  if (index >= 0) list[index] = normalized;
  else list.push(normalized);
  writeJSON(STORAGE_KEY, list);
  return normalized;
}

/** Elimina lo scout per id. */
export function eliminaScout(id) {
  writeJSON(
    STORAGE_KEY,
    tutti().filter((scout) => scout.id !== id),
  );
}

/** Tutti gli scout di tutte le squadre (usato dal backup completo). */
export function getTuttiScout() {
  return tutti().map(normalizeScout);
}

/** Sostituisce l'elenco completo degli scout (usato dall'import del backup). */
export function setTuttiScout(scouts) {
  const list = isList(scouts).map(normalizeScout);
  writeJSON(STORAGE_KEY, list);
  return list;
}
