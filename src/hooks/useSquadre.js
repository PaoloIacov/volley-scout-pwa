import { useSyncExternalStore, useMemo } from 'react';
import {
  getSquadraAttiva,
  getSquadre,
  getVersioneSquadre,
  subscribeSquadre,
} from '../services/squadre.js';

/**
 * Squadre e squadra attiva, reattive alle modifiche: l'header e le pagine
 * si aggiornano quando si crea, elimina o seleziona una squadra.
 */
export function useSquadre() {
  const versione = useSyncExternalStore(subscribeSquadre, getVersioneSquadre, getVersioneSquadre);
  return useMemo(
    () => ({ versione, squadre: getSquadre(), attiva: getSquadraAttiva() }),
    [versione]
  );
}

/** Squadra attiva reattiva (o `null` se non esiste ancora). */
export function useSquadraAttiva() {
  return useSquadre().attiva;
}
