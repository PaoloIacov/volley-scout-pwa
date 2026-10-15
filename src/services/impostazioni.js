import { readJSON, writeJSON } from '../lib/storage.js';

const STORAGE_KEY = 'impostazioni';

export const TEMI = ['scuro', 'chiaro', 'sistema'];

export const TEMA_LABELS = {
  scuro: 'Scuro',
  chiaro: 'Chiaro',
  sistema: 'Sistema',
};

/**
 * Impostazioni globali.
 * Il tema è l'unica impostazione globale: identità, foto e stagione vivono
 * nella squadra (pagina Squadre), perché ogni squadra ha le proprie.
 */
export function impostazioniDefault() {
  return { tema: 'sistema' };
}

export function normalizeImpostazioni(stored) {
  const source = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  return { tema: TEMI.includes(source.tema) ? source.tema : 'sistema' };
}

export function getImpostazioni() {
  return normalizeImpostazioni(readJSON(STORAGE_KEY, null));
}

export function setImpostazioni(next) {
  const normalized = normalizeImpostazioni(next);
  writeJSON(STORAGE_KEY, normalized);
  return normalized;
}

export function resetImpostazioni() {
  const defaults = impostazioniDefault();
  writeJSON(STORAGE_KEY, defaults);
  return defaults;
}
