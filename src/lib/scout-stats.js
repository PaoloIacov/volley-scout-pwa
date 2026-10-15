/* Costanti e calcoli dello scout partita. */

/** Azioni rilevabili, nell'ordine di visualizzazione. */
export const AZIONI = [
  { id: 'ricezione', label: 'Ricezione' },
  { id: 'attacco', label: 'Attacco' },
  { id: 'difesa', label: 'Difesa' },
  { id: 'muro', label: 'Muro' },
  { id: 'battuta', label: 'Battuta' },
];

/** Quattro codici di esito dell'azione. */
export const ESITI = [
  { id: '#', label: 'Perfetta', breve: 'perfetta' },
  { id: '+', label: 'Positiva', breve: 'positiva' },
  { id: '-', label: 'Negativa', breve: 'negativa' },
  { id: '=', label: 'Errore', breve: 'errore' },
];

/**
 * Classi per gli esiti: `attivo` per i pulsanti selezionati (tono pieno),
 * `tondo` per i riepiloghi testuali (tono tenue + cerchio).
 */
export const ESITO_CLASSI = {
  '#': { attivo: 'bg-ok text-white', tondo: 'text-ok bg-ok/10 ring-ok/30' },
  '+': { attivo: 'bg-info text-white', tondo: 'text-info bg-info/10 ring-info/30' },
  '-': { attivo: 'bg-warn text-white', tondo: 'text-warn bg-warn/10 ring-warn/30' },
  '=': { attivo: 'bg-ko text-white', tondo: 'text-ko bg-ko/10 ring-ko/30' },
};

/** True se la stringa è un codice esito valido. */
export function isEsito(value) {
  return ESITI.some((esito) => esito.id === value);
}

/** True se la stringa è un'azione valida. */
export function isAzione(value) {
  return AZIONI.some((azione) => azione.id === value);
}

function cellaVuota() {
  return { tot: 0, '#': 0, '+': 0, '-': 0, '=': 0 };
}

/**
 * Riepilogo parziale dello scout: una riga per ogni giocatore della squadra
 * scoutizzata (più ogni numero avversario che ha registrato azioni), con i
 * conteggi per azione ed esito.
 *
 * @param {object} scout record scout
 * @param {Array} giocatori rosa della squadra che possiede lo scout
 * @returns {{ righe: Array, totali: object }}
 */
export function costruisciRiepilogo(scout, giocatori) {
  const osservaRosa = scout.squadraOsservata === 'propria';
  const rosa = Array.isArray(giocatori) ? giocatori : [];
  const nomi = new Map(
    rosa.map((giocatore) => [
      giocatore.numeroMaglia,
      `${giocatore.nome ?? ''} ${giocatore.cognome ?? ''}`.trim(),
    ]),
  );

  // Chi compare: la rosa (se scoutizziamo le nostre ragazze) + i numeri con azioni.
  const numeri = new Set();
  if (osservaRosa) rosa.forEach((giocatore) => numeri.add(giocatore.numeroMaglia));
  scout.azioni.forEach((azione) => numeri.add(azione.numero));

  const righe = [...numeri]
    .sort((a, b) => a - b)
    .map((numero) => {
      const celle = Object.fromEntries(AZIONI.map((azione) => [azione.id, cellaVuota()]));
      scout.azioni
        .filter((azione) => azione.numero === numero)
        .forEach((azione) => {
          const cella = celle[azione.azione];
          if (!cella) return;
          cella.tot += 1;
          if (isEsito(azione.esito)) cella[azione.esito] += 1;
        });
      const tot = AZIONI.reduce((somma, azione) => somma + celle[azione.id].tot, 0);
      return {
        numero,
        nome: (osservaRosa && nomi.get(numero)) || '',
        celle,
        tot,
      };
    });

  const totali = Object.fromEntries(AZIONI.map((azione) => [azione.id, cellaVuota()]));
  righe.forEach((riga) => {
    AZIONI.forEach((azione) => {
      const cella = riga.celle[azione.id];
      const somma = totali[azione.id];
      somma.tot += cella.tot;
      ESITI.forEach(({ id }) => (somma[id] += cella[id]));
    });
  });

  return { righe, totali };
}
