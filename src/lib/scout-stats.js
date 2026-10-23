/* Costanti e calcoli dello scout partita. */

/** Azioni rilevabili, nell'ordine di visualizzazione. */
export const AZIONI = [
  { id: 'ricezione', label: 'Ricezione' },
  { id: 'attacco', label: 'Attacco' },
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

/**
 * Punti generati automaticamente da un esito: il perfetto (#) segna per noi
 * solo per attacco, muro e battuta; la ricezione perfetta è un dato tecnico e
 * non muove il punteggio. L'errore (=) segna sempre per l'avversario; + e -
 * non muovono il punteggio.
 *
 * @param {string} esito codice esito (# + - =)
 * @param {string} [azione] azione rilevata (ricezione, attacco, muro, battuta)
 */
export function puntiPerEsito(esito, azione) {
  if (esito === '#') return azione === 'ricezione' ? { nostro: 0, loro: 0 } : { nostro: 1, loro: 0 };
  if (esito === '=') return { nostro: 0, loro: 1 };
  return { nostro: 0, loro: 0 };
}

/**
 * Stato del set secondo le regole della pallavolo: si chiude a 25 (15 nel
 * tie-break) con almeno due punti di scarto. Finché lo scarto è di uno si è
 * ai vantaggi: non esiste alcun tetto al punteggio.
 *
 * @param {{nostro:number, loro:number}} set punteggio del set
 * @param {number} [nSet] numero del set (il quinto è il tie-break)
 * @returns {{etichetta:string, tipo:'set-point'|'vantaggio'|'concluso'}|null}
 */
export function statoSet(set, nSet = 1) {
  const nostro = Math.max(0, Number(set?.nostro) || 0);
  const loro = Math.max(0, Number(set?.loro) || 0);
  const traguardo = Number(nSet) >= 5 ? 15 : 25;
  const massimo = Math.max(nostro, loro);
  const minimo = Math.min(nostro, loro);
  if (massimo >= traguardo && massimo - minimo >= 2) {
    return { etichetta: 'Set concluso', tipo: 'concluso' };
  }
  if (massimo >= traguardo && massimo - minimo === 1) {
    return { etichetta: 'Vantaggio', tipo: 'vantaggio' };
  }
  if (massimo >= traguardo - 1 && massimo - minimo >= 1) {
    return { etichetta: 'Set point', tipo: 'set-point' };
  }
  return null;
}

/** Limite dei convocati: 12 di movimento più fino a 2 liberi. */
export const MAX_MOVIMENTO = 12;
export const MAX_LIBERI = 2;
export const MAX_CONVOCATI = MAX_MOVIMENTO + MAX_LIBERI;

/** In campo: 6 giocatori di movimento più un libero. */
export const IN_CAMPO_MOVIMENTO = 6;
export const IN_CAMPO_LIBERI = 1;
export const TITOLARI = IN_CAMPO_MOVIMENTO + IN_CAMPO_LIBERI;

/** True se il giocatore è di ruolo libero (il ruolo è case-insensitive). */
export function isLibero(giocatore) {
  return (
    String(giocatore?.ruolo ?? '')
      .trim()
      .toLowerCase() === 'libero'
  );
}

/** Numeri dei giocatori di ruolo libero. */
export function numeriLiberi(giocatori) {
  return new Set(
    (Array.isArray(giocatori) ? giocatori : []).filter(isLibero).map((g) => g.numeroMaglia),
  );
}

/**
 * Compone una formazione valida per il campo: al massimo 6 giocatori di
 * movimento e 1 libero, con il libero sempre in fondo (per la tabella).
 * L'ordine dei giocatori di movimento resta quello ricevuto.
 *
 * @param {number[]} numeri numeri scelti
 * @param {Array} giocatori rosa (per riconoscere i liberi)
 * @returns {number[]}
 */
export function componiFormazione(numeri, giocatori) {
  const liberi = numeriLiberi(giocatori);
  const scelti = [...new Set((Array.isArray(numeri) ? numeri : []).map(Number))].filter(
    (numero) => numero > 0,
  );
  const movimento = scelti.filter((numero) => !liberi.has(numero)).slice(0, IN_CAMPO_MOVIMENTO);
  const portieri = scelti.filter((numero) => liberi.has(numero)).slice(0, IN_CAMPO_LIBERI);
  return [...movimento, ...portieri];
}

/**
 * Formazione predefinita: i primi 6 di movimento e il primo libero tra i
 * numeri disponibili (di norma i convocati), nell'ordine ricevuto.
 */
export function formazionePredefinita(numeri, giocatori) {
  return componiFormazione(numeri, giocatori);
}

/** Formazione scelta per un set (undefined se non ancora impostata). */
export function formazioneDelSet(scout, setN) {
  const voci = Array.isArray(scout?.formazioni) ? scout.formazioni : [];
  return voci.find((voce) => Number(voce?.set) === Number(setN))?.numeri;
}

/** Restituisce l'elenco formazioni aggiornato con quella del set indicato. */
export function impostaFormazione(scout, setN, numeri) {
  const elenco = [...new Set((Array.isArray(numeri) ? numeri : []).map(Number))].filter(
    (numero) => numero > 0,
  );
  const altre = (Array.isArray(scout?.formazioni) ? scout.formazioni : []).filter(
    (voce) => Number(voce?.set) !== Number(setN),
  );
  return [...altre, { set: Number(setN), numeri: elenco }].sort((a, b) => a.set - b.set);
}

/** Numero di errori generici (punto all'avversario, fuori dalle statistiche). */
export function contaGenerici(scout) {
  return Array.isArray(scout?.generici) ? scout.generici.length : 0;
}

/** Numero di errori avversari (punto nostro, fuori dalle statistiche). */
export function contaErroriAvversari(scout) {
  return Array.isArray(scout?.erroriAvversari) ? scout.erroriAvversari.length : 0;
}

/** Eventi senza giocatore raggruppati per set: `[{ set, n }]` ordinati per set. */
function eventiPerSet(eventi) {
  const conteggi = new Map();
  (Array.isArray(eventi) ? eventi : []).forEach((evento) => {
    const set = Math.max(1, Number(evento?.set) || 1);
    conteggi.set(set, (conteggi.get(set) ?? 0) + 1);
  });
  return [...conteggi.entries()].sort((a, b) => a[0] - b[0]).map(([set, n]) => ({ set, n }));
}

/** Errori generici raggruppati per set: `[{ set, n }]` ordinati per set. */
export function genericiPerSet(scout) {
  return eventiPerSet(scout?.generici);
}

/** Errori avversari raggruppati per set: `[{ set, n }]` ordinati per set. */
export function erroriAvversariPerSet(scout) {
  return eventiPerSet(scout?.erroriAvversari);
}

function cellaVuota() {
  return { tot: 0, '#': 0, '+': 0, '-': 0, '=': 0 };
}

/**
 * Sintesi di un giocatore (o dei totali di squadra) a partire dalle celle per
 * azione restituite da `costruisciRiepilogo`.
 *
 * - Punti fatti: i `#` di attacco, muro e battuta (la ricezione perfetta è un
 *   dato tecnico e non assegna punto).
 * - Errori fatti: tutti i `=` (ricezione, attacco, muro, battuta).
 * - Palloni attaccati: tutte le azioni di attacco, qualunque sia l'esito.
 *
 * @param {object} celle oggetto `{ ricezione, attacco, muro, battuta }`
 * @returns {{puntiFatti:number, erroriFatti:number, palloniAttaccati:number}}
 */
export function sintesiCelle(celle) {
  const vuota = cellaVuota();
  const ricezione = celle?.ricezione ?? vuota;
  const attacco = celle?.attacco ?? vuota;
  const muro = celle?.muro ?? vuota;
  const battuta = celle?.battuta ?? vuota;
  return {
    puntiFatti: attacco['#'] + muro['#'] + battuta['#'],
    erroriFatti: ricezione['='] + attacco['='] + muro['='] + battuta['='],
    palloniAttaccati: attacco.tot,
  };
}

/**
 * Statistiche complessive di un giocatore basate su tutti gli scout della
 * squadra. Le azioni vengono riconosciute dal numero di maglia e si considerano
 * solo gli scout in cui si osserva la squadra propria (le rilevazioni
 * sull'avversaria non possono essere attribuite ai nostri giocatori).
 *
 * @param {object} giocatore giocatore della rosa
 * @param {Array} scouts scout della squadra
 * @returns {{
 *   celle: object,
 *   totaliPerEsito: object,
 *   sintesi: {puntiFatti:number, erroriFatti:number, palloniAttaccati:number},
 *   azioni: number,
 *   setGiocati: number,
 *   partite: Array
 * }}
 */
export function statisticheGiocatore(giocatore, scouts = []) {
  const numero = Number(giocatore?.numeroMaglia) || 0;
  const celle = Object.fromEntries(AZIONI.map((azione) => [azione.id, cellaVuota()]));
  const partite = [];

  (Array.isArray(scouts) ? scouts : []).forEach((scout) => {
    if (!scout || scout.squadraOsservata === 'avversaria') return;
    const azioni = (Array.isArray(scout.azioni) ? scout.azioni : []).filter(
      (azione) => Number(azione.numero) === numero,
    );
    if (azioni.length === 0) return;

    const cellePartita = Object.fromEntries(AZIONI.map((azione) => [azione.id, cellaVuota()]));
    const set = new Set();
    azioni.forEach((azione) => {
      const cella = cellePartita[azione.azione];
      if (!cella) return;
      cella.tot += 1;
      if (isEsito(azione.esito)) cella[azione.esito] += 1;
      set.add(Math.max(1, Number(azione.set) || 1));
    });

    const sintesi = sintesiCelle(cellePartita);
    partite.push({
      id: scout.id,
      data: scout.data,
      avversario: scout.avversario,
      luogo: scout.luogo,
      tipo: scout.tipo,
      setGiocati: set.size,
      azioni: azioni.length,
      ...sintesi,
    });

    AZIONI.forEach((azione) => {
      const cella = celle[azione.id];
      const parziale = cellePartita[azione.id];
      cella.tot += parziale.tot;
      ESITI.forEach(({ id }) => (cella[id] += parziale[id]));
    });
  });

  const totaliPerEsito = Object.fromEntries(
    ESITI.map(({ id }) => [id, AZIONI.reduce((somma, azione) => somma + celle[azione.id][id], 0)]),
  );

  return {
    celle,
    totaliPerEsito,
    sintesi: sintesiCelle(celle),
    azioni: AZIONI.reduce((somma, azione) => somma + celle[azione.id].tot, 0),
    setGiocati: partite.reduce((somma, partita) => somma + partita.setGiocati, 0),
    partite: partite.sort((a, b) => String(b.data).localeCompare(String(a.data))),
  };
}

/**
 * Ordina un elenco di numeri di maglia secondo l'ordine personalizzato salvato
 * nello scout: chi è nell'ordine segue quella sequenza, gli altri (numeri nuovi
 * o non presenti) restano in coda in ordine numerico crescente.
 *
 * @param {number[]} numeri numeri da ordinare
 * @param {number[]|undefined} ordine ordine personalizzato (`scout.ordineGiocatori`)
 */
export function ordinaNumeri(numeri, ordine) {
  const elenco = [...numeri];
  if (!Array.isArray(ordine) || ordine.length === 0) return elenco.sort((a, b) => a - b);
  const posizione = new Map(ordine.map((numero, index) => [numero, index]));
  const valore = (numero) =>
    posizione.has(numero) ? posizione.get(numero) : Number.MAX_SAFE_INTEGER;
  return elenco.sort((a, b) => valore(a) - valore(b) || a - b);
}

/**
 * Riepilogo parziale dello scout: una riga per ogni convocato della squadra
 * (più ogni numero che ha registrato azioni), con i conteggi per azione ed esito.
 *
 * @param {object} scout record scout
 * @param {Array} giocatori rosa della squadra che possiede lo scout
 * @param {number|null} [setN] se indicato, considera solo le azioni di quel set
 * @returns {{ righe: Array, totali: object, totaliPerEsito: object }}
 */
export function costruisciRiepilogo(scout, giocatori, setN = null) {
  const osservaRosa = scout.squadraOsservata === 'propria';
  const rosa = Array.isArray(giocatori) ? giocatori : [];
  const azioni =
    setN === null || setN === undefined
      ? scout.azioni
      : scout.azioni.filter((azione) => Number(azione.set) === Number(setN));
  const nomi = new Map(
    rosa.map((giocatore) => [
      giocatore.numeroMaglia,
      `${giocatore.nome ?? ''} ${giocatore.cognome ?? ''}`.trim(),
    ]),
  );

  // Chi compare: la rosa convocata (se scoutizziamo la nostra squadra)
  // + ogni numero che ha registrato azioni.
  const numeri = new Set();
  if (osservaRosa) {
    const convocati =
      Array.isArray(scout.convocati) && scout.convocati.length > 0
        ? new Set(scout.convocati)
        : null;
    rosa.forEach((giocatore) => {
      if (!convocati || convocati.has(giocatore.numeroMaglia)) {
        numeri.add(giocatore.numeroMaglia);
      }
    });
  }
  azioni.forEach((azione) => numeri.add(azione.numero));

  const righe = ordinaNumeri([...numeri], scout?.ordineGiocatori).map((numero) => {
    const celle = Object.fromEntries(AZIONI.map((azione) => [azione.id, cellaVuota()]));
    azioni
      .filter((azione) => azione.numero === numero)
      .forEach((azione) => {
        const cella = celle[azione.azione];
        if (!cella) return;
        cella.tot += 1;
        if (isEsito(azione.esito)) cella[azione.esito] += 1;
      });
    const tot = AZIONI.reduce((somma, azione) => somma + celle[azione.id].tot, 0);
    // Totali della riga per esito: servono alla colonna Tot suddivisa.
    const perEsito = Object.fromEntries(
      ESITI.map(({ id }) => [id, AZIONI.reduce((somma, azione) => somma + celle[azione.id][id], 0)]),
    );
    return {
      numero,
      nome: (osservaRosa && nomi.get(numero)) || '',
      celle,
      tot,
      perEsito,
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

  const totaliPerEsito = Object.fromEntries(
    ESITI.map(({ id }) => [id, AZIONI.reduce((somma, azione) => somma + totali[azione.id][id], 0)]),
  );

  return { righe, totali, totaliPerEsito };
}
