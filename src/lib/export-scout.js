/* Esportazione dello scout in Excel (.xlsx) e PDF: contenuto sintetico
   (info partita, punteggi dei set e tabella riepilogo per giocatore, con
   numero di maglia separato dal nome e ogni colonna — Tot compresa —
   suddivisa nelle 4 sotto-colonne di esito).
   Le librerie vengono caricate dinamicamente all'export, così non pesano
   sul caricamento iniziale dell'app. */
import { toItalianDate } from './dates.js';
import {
  AZIONI,
  ESITI,
  costruisciRiepilogo,
  contaErroriAvversari,
  contaGenerici,
  erroriAvversariPerSet,
  genericiPerSet,
  riconoscimentiPartita,
} from './scout-stats.js';

/** Colori dell'export, allineati al tema dell'app. */
const COL_INTTESTAZIONE = '#18181b';
const COL_INTTESTAZIONE_RGB = [24, 24, 27];
const COL_TESTO = '#18181b';
const COL_TOTALE = '#f4f4f5';
const COL_TOTALE_RGB = [244, 244, 245];
const COL_TESTO_RGB = [24, 24, 27];
const COL_MUTE_RGB = [113, 113, 122];
const COL_LINEA_RGB = [228, 228, 231];
const COL_LINEA = '#e4e4e7';
const COL_LINEA_SCURA_RGB = [161, 161, 170];
const COL_LINEA_SCURA = '#a1a1aa';
const COL_SEZIONE_RGB = [63, 63, 70];
const COL_SEZIONE = '#3f3f46';
const COL_MUTE = '#71717a';
/** Colori degli esiti, allineati ai token del tema chiaro dell'app. */
const COL_ESITI = { '#': '#059669', '+': '#0284c7', '-': '#d97706', '=': '#dc2626' };
const COL_ESITI_RGB = {
  '#': [5, 150, 105],
  '+': [2, 132, 199],
  '-': [217, 119, 6],
  '=': [220, 38, 38],
};

/** Codici degli esiti nell'ordine delle sotto-colonne. */
const ESITI_GRUPPO = ESITI.map(({ id }) => id);
/** Sotto-colonne aggiuntive per le azioni con percentuali. */
const SOTTO_COLONNE_PERCENTUALI = ['Pos', 'Eff'];

/**
 * Gruppi di colonne del riepilogo. Ricezione, attacco e battuta hanno anche
 * Positività (`#` / palloni) ed Efficienza ((`#` - `=`) / palloni), in
 * percentuale; muro e Tot restano sulle quattro colonne di esito.
 */
const GRUPPI_COLONNE = [
  { azione: 'ricezione', label: 'Ricezione', percentuali: true },
  { azione: 'attacco', label: 'Attacco', percentuali: true },
  { azione: 'muro', label: 'Muro', percentuali: false },
  { azione: 'battuta', label: 'Battuta', percentuali: true },
  { azione: 'tot', label: 'Tot', percentuali: false },
];
const AZIONI_PERCENTUALI = new Set(
  GRUPPI_COLONNE.filter((gruppo) => gruppo.percentuali).map((gruppo) => gruppo.azione),
);

/** Sotto-colonne di un gruppo (4 esiti, più Pos ed Eff dove previste). */
function sottoColonne(gruppo) {
  return [
    ...ESITI_GRUPPO,
    ...(gruppo.percentuali ? SOTTO_COLONNE_PERCENTUALI : []),
  ];
}

/** Colonne numeriche: 4 esiti per azione + Pos/Eff + il Tot. */
const COLONNE_NUMERICHE = GRUPPI_COLONNE.reduce(
  (somma, gruppo) => somma + sottoColonne(gruppo).length,
  0,
);
/** Indice della prima colonna numerica (dopo N. e Giocatore). */
const PRIMA_COLONNA_ESITI = 2;

/** Indici delle colonne che aprono un gruppo (per i divisori verticali). */
const INIZI_GRUPPO = new Set();
{
  let indice = PRIMA_COLONNA_ESITI;
  GRUPPI_COLONNE.forEach((gruppo) => {
    INIZI_GRUPPO.add(indice);
    indice += sottoColonne(gruppo).length;
  });
}

/** Descrittore di ogni colonna numerica, nell'ordine in cui viene stampata. */
const DESCRITTORI_COLONNA = GRUPPI_COLONNE.flatMap((gruppo) => [
  ...ESITI_GRUPPO.map((esito) => ({
    gruppo: gruppo.azione,
    label: esito,
    esito,
    percentuale: false,
  })),
  ...(gruppo.percentuali
    ? SOTTO_COLONNE_PERCENTUALI.map((label) => ({
        gruppo: gruppo.azione,
        label,
        esito: null,
        percentuale: true,
      }))
    : []),
]);

/** Ordine con cui raggruppare i giocatori per ruolo nei riepiloghi. */
export const ORDINE_RUOLI = ['Palleggiatore', 'Opposto', 'Schiacciatore', 'Centrale', 'Libero'];
/** Gruppo di chi non ha un ruolo riconosciuto (es. numero fuori rosa). */
const RUOLO_ALTRI = 'Altri';

/** Ruolo canonico (con iniziale maiuscola) o stringa vuota se sconosciuto. */
function ruoloCanonico(ruolo) {
  const testo = String(ruolo ?? '').trim().toLowerCase();
  return ORDINE_RUOLI.find((voce) => voce.toLowerCase() === testo) ?? '';
}

/** True se la colonna apre un nuovo gruppo (Ricezione, Attacco, Muro, Battuta, Tot). */
function apreGruppo(indice) {
  return INIZI_GRUPPO.has(indice);
}

/**
 * Dati dell'export in blocchi pronti: `info` (righe etichetta/valore),
 * `punteggio` e `riepilogo` (gruppi + esiti per l'intestazione a due
 * livelli, righe e totale con un numero per ogni sotto-colonna).
 *
 * @param {object} scout record scout
 * @param {Array} giocatori rosa della squadra che possiede lo scout
 * @param {string} squadraNome nome della squadra (per l'info)
 */
export function costruisciExport(scout, giocatori = [], squadraNome = '', setN = null) {
  const { righe, totali, totaliPerEsito } = costruisciRiepilogo(scout, giocatori, setN);
  const riconoscimenti = riconoscimentiPartita(scout, giocatori, setN);

  const osservata =
    scout.squadraOsservata === 'avversaria' ? 'Avversaria' : squadraNome || 'Propria';
  const info = [
    ['Squadra', squadraNome],
    ['Avversario', scout.avversario],
    ['Data', toItalianDate(scout.data)],
    ['Orario', scout.orarioInizio],
    ['Luogo', scout.luogo],
    ['Tipo di gara', scout.tipo === 'amichevole' ? 'Amichevole' : 'Campionato'],
    ['Squadra osservata', osservata],
    ['Azioni rilevate', scout.azioni.length],
    ['Errori generici', contaGenerici(scout)],
    ['Punti da errori avversari', contaErroriAvversari(scout)],
  ].filter(([, value]) => value !== '' && value !== null && value !== undefined);

  let setNostri = 0;
  let setLoro = 0;
  scout.sets.forEach((set) => {
    if (set.nostro > set.loro) setNostri += 1;
    else if (set.loro > set.nostro) setLoro += 1;
  });

  const generici = new Map(genericiPerSet(scout).map((voce) => [voce.set, voce.n]));
  const avversari = new Map(erroriAvversariPerSet(scout).map((voce) => [voce.set, voce.n]));

  /**
   * Positività ((`#` + `+`) / palloni) ed Efficienza ((`#` + `+` - `-` - `=`)
   * / palloni), in percentuale intera. `null` quando non ci sono palloni per
   * quell'azione.
   */
  const percentuali = (cella) => {
    if (!cella.tot) return [null, null];
    return [
      Math.round(((cella['#'] + cella['+']) / cella.tot) * 100),
      Math.round(
        ((cella['#'] + cella['+'] - cella['-'] - cella['=']) / cella.tot) * 100,
      ),
    ];
  };

  /**
   * Riga del riepilogo: per ogni azione le 4 colonne di esito e, dove
   * previste, Pos ed Eff; poi le 4 colonne di esito del Tot.
   */
  const numeriRiga = (celle, perEsito) => [
    ...AZIONI.flatMap((azione) => {
      const esiti = ESITI.map(({ id }) => celle[azione.id][id]);
      return AZIONI_PERCENTUALI.has(azione.id)
        ? [...esiti, ...percentuali(celle[azione.id])]
        : esiti;
    }),
    ...ESITI.map(({ id }) => perEsito[id]),
  ];

  // Ruolo di ogni numero di maglia, per raggruppare le righe invece di
  // lasciarle nell'ordine del numero. Chi non è in rosa finisce in "Altri".
  // Quando si osserva l'avversaria i numeri non sono i nostri: niente ruoli.
  const usaRuoli = scout.squadraOsservata !== 'avversaria';
  const ruoloPerNumero = new Map(
    (usaRuoli && Array.isArray(giocatori) ? giocatori : []).map((giocatore) => [
      Number(giocatore?.numeroMaglia),
      ruoloCanonico(giocatore?.ruolo),
    ]),
  );
  const posizioneRuolo = new Map(ORDINE_RUOLI.map((ruolo, indice) => [ruolo, indice]));
  const ordinaPerRuolo = (a, b) => {
    const ruoloA = ruoloPerNumero.get(Number(a.numero)) || '';
    const ruoloB = ruoloPerNumero.get(Number(b.numero)) || '';
    const posizioneA = posizioneRuolo.get(ruoloA) ?? ORDINE_RUOLI.length;
    const posizioneB = posizioneRuolo.get(ruoloB) ?? ORDINE_RUOLI.length;
    return posizioneA - posizioneB || Number(a.numero) - Number(b.numero);
  };
  const righeOrdinate = [...righe].sort(ordinaPerRuolo);

  /** Riga piatta dell'export: numero, nome e conteggi. */
  const rigaExport = (riga) => [
    riga.numero,
    riga.nome,
    ...numeriRiga(riga.celle, riga.perEsito),
  ];

  // Stesse righe raggruppate per ruolo, pronte per le intestazioni di gruppo.
  const gruppiRuolo = [];
  if (usaRuoli) {
    righeOrdinate.forEach((riga) => {
      const ruolo = ruoloPerNumero.get(Number(riga.numero)) || RUOLO_ALTRI;
      let gruppo = gruppiRuolo[gruppiRuolo.length - 1];
      if (!gruppo || gruppo.ruolo !== ruolo) {
        gruppo = { ruolo, righe: [] };
        gruppiRuolo.push(gruppo);
      }
      gruppo.righe.push(rigaExport(riga));
    });
  }

  return {
    titolo: scout.avversario ? `Scout vs ${scout.avversario}` : 'Scout',
    setN,
    info,
    punteggio: {
      header: ['Set', 'Noi', 'Loro', 'Generici', 'Errori avv.'],
      righe: scout.sets.map((set) => [
        `Set ${set.n}`,
        set.nostro,
        set.loro,
        generici.get(set.n) ?? 0,
        avversari.get(set.n) ?? 0,
      ]),
      totale: [
        'Set vinti',
        setNostri,
        setLoro,
        contaGenerici(scout),
        contaErroriAvversari(scout),
      ],
    },
    riepilogo: {
      // Numero e nome sono colonne separate; `colonne` descrive i gruppi
      // numerici con le rispettive sotto-colonne (esiti, Pos, Eff).
      gruppi: ['N.', 'Giocatore', ...AZIONI.map((azione) => azione.label), 'Tot'],
      esiti: ESITI.map(({ id }) => id),
      colonne: GRUPPI_COLONNE.map((gruppo) => ({
        label: gruppo.label,
        sotto: sottoColonne(gruppo),
      })),
      righe: righeOrdinate.map(rigaExport),
      gruppiRuolo,
      totale: ['', 'Totale', ...numeriRiga(totali, totaliPerEsito)],
    },
    riconoscimenti,
  };
}

/**
 * Classifiche dei riconoscimenti nell'ordine in cui vengono stampate, con il
 * dettaglio del valore e il campo usato per rilevare i pari merito.
 */
function classificheRiconoscimenti(riconoscimenti) {
  return [
    {
      label: 'Top 3 punti fatti',
      voci: riconoscimenti.topPunti,
      dettaglio: (voce) => `${voce.punti} pt`,
      valore: (voce) => voce.punti,
    },
    {
      label: 'Top 3 efficienza in ricezione',
      voci: riconoscimenti.topEfficienzaRicezione,
      dettaglio: (voce) => `${voce.efficienza}%`,
      valore: (voce) => voce.efficienza,
    },
    {
      label: 'Top 3 efficienza in attacco',
      voci: riconoscimenti.topEfficienzaAttacco,
      dettaglio: (voce) => `${voce.efficienza}%`,
      valore: (voce) => voce.efficienza,
    },
    {
      label: 'Top 3 efficienza in battuta',
      voci: riconoscimenti.topEfficienzaBattuta,
      dettaglio: (voce) => `${voce.efficienza}%`,
      valore: (voce) => voce.efficienza,
    },
    {
      label: 'Top 3 Ace-man',
      voci: riconoscimenti.topAceMan,
      dettaglio: (voce) => `${voce.ace} ace`,
      valore: (voce) => voce.ace,
    },
    {
      label: 'Top 3 Pericolo pubblico',
      voci: riconoscimenti.topPericoloPubblico,
      dettaglio: (voce) => `${voce.errori} errori`,
      valore: (voce) => voce.errori,
    },
  ];
}

/**
 * Posizione in classifica di ogni voce, con pari merito: valori uguali
 * ricevono la stessa posizione e la successiva salta (1, 1, 3, ...).
 */
function posizioniClassifica(voci, valore) {
  let posizione = 0;
  let ultimo;
  return voci.map((voce, indice) => {
    const corrente = valore(voce);
    if (indice === 0 || corrente !== ultimo) {
      posizione = indice + 1;
      ultimo = corrente;
    }
    return posizione;
  });
}

/**
 * Divide le informazioni della partita in righe da `perRiga` coppie
 * etichetta/valore: serve a occupare tutta la larghezza del foglio/PDF
 * invece di impilare i dati in un'unica colonna.
 */
export function raggruppaInfo(info, perRiga = 3) {
  const gruppi = [];
  for (let i = 0; i < info.length; i += perRiga) {
    gruppi.push(info.slice(i, i + perRiga));
  }
  return gruppi;
}

/** Nome file sicuro per il filesystem: `scout_Volley-Beta_2026-12-01.xlsx`. */
export function nomeFileScout(scout, estensione) {
  const base = ['scout', scout.avversario, scout.data]
    .filter(Boolean)
    .join('_')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'scout'}.${estensione}`;
}

const CARATTERI_TIPOGRAFICI = {
  '’': "'",
  '‘': "'",
  '“': '"',
  '”': '"',
  '–': '-',
  '—': '-',
  '…': '...',
};

/**
 * Testo utilizzabile nelle stringhe PDF di jsPDF con i font standardi
 * (codificati in WinAnsi): sostituisce i caratteri tipografici e
 * decompone i caratteri oltre la Latin-1 (es. `ü` resta, `ø` → `?`).
 */
export function testoPdf(value) {
  return String(value ?? '')
    .replace(/[’‘“”–—…]/g, (carattere) => CARATTERI_TIPOGRAFICI[carattere])
    .replace(/[^\u0000-\u00FF]/g, (carattere) => {
      const decomposto = carattere.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return /[^\u0000-\u00FF]/.test(decomposto) ? '?' : decomposto;
    });
}

/** Scarica un Blob con il solito meccanismo dell'app (link + object URL). */
function scaricaBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/** Esporta il riepilogo in `.xlsx` (write-excel-file, caricata al momento). */
export async function esportaScoutExcel(scout, giocatori, squadraNome) {
  const dati = costruisciExport(scout, giocatori, squadraNome);
  const { default: writeExcelFile } = await import('write-excel-file/browser');

  const cella = (value, style = {}) => {
    if (value === '' || value === null || value === undefined) return null;
    if (typeof value === 'number') return { value, align: 'center', ...style };
    return { value: String(value), ...style };
  };
  const stile = {
    titolo: { fontWeight: 'bold', fontSize: 16 },
    sezione: { fontWeight: 'bold', fontSize: 13 },
    etichetta: {
      fontWeight: 'bold',
      textColor: COL_TESTO,
      backgroundColor: COL_TOTALE,
      align: 'left',
      alignVertical: 'center',
      borderStyle: 'thin',
      borderColor: COL_LINEA,
    },
    valoreInfo: {
      textColor: COL_TESTO,
      align: 'left',
      alignVertical: 'center',
      borderStyle: 'thin',
      borderColor: COL_LINEA,
    },
    intestazione: {
      fontWeight: 'bold',
      textColor: '#ffffff',
      backgroundColor: COL_INTTESTAZIONE,
      borderStyle: 'thin',
      borderColor: '#3f3f46',
      alignVertical: 'center',
    },
    intestazioneGruppo: {
      leftBorderStyle: 'medium',
      leftBorderColor: '#ffffff',
    },
    totale: {
      fontWeight: 'bold',
      backgroundColor: COL_TOTALE,
      borderStyle: 'thin',
      borderColor: COL_LINEA,
    },
  };

  /** Cella con bordo sottile, usata da punteggi e riepilogo. */
  const cellaBordata = (value, style = {}) => ({
    ...cella(value, style),
    borderStyle: style.borderStyle ?? 'thin',
    borderColor: style.borderColor ?? COL_LINEA,
  });

  /** Numero del riepilogo: colorato per esito, grigio quando è zero. */
  const cellaNumero = (value, colonna, extra = {}) => {
    const bordoGruppo = apreGruppo(colonna)
      ? { leftBorderStyle: 'medium', leftBorderColor: COL_INTTESTAZIONE }
      : {};
    const base = { borderStyle: 'thin', borderColor: COL_LINEA, ...bordoGruppo, ...extra };
    if (colonna === 0) {
      return { value, align: 'center', ...base };
    }
    if (colonna === 1) {
      return { value: String(value ?? ''), align: 'left', ...base };
    }
    const descrittore = DESCRITTORI_COLONNA[colonna - PRIMA_COLONNA_ESITI];
    if (descrittore?.percentuale) {
      if (value === null || value === undefined) {
        return { value: '—', align: 'center', textColor: COL_MUTE, ...base };
      }
      return {
        value: value / 100,
        format: '0%',
        align: 'center',
        textColor:
          value > 0 ? COL_ESITI['#'] : value < 0 ? COL_ESITI['='] : COL_MUTE,
        ...base,
      };
    }
    return {
      value,
      align: 'center',
      textColor: value > 0 ? COL_ESITI[descrittore?.esito] : COL_MUTE,
      ...base,
    };
  };

  /** Riga di sezione a tutta larghezza. */
  const rigaSezione = (titolo) => [
    cella(titolo, {
      ...stile.sezione,
      backgroundColor: COL_TOTALE,
      columnSpan: 1 + 1 + COLONNE_NUMERICHE,
    }),
    ...Array.from({ length: COLONNE_NUMERICHE + 1 }, () => null),
  ];

  /**
   * Info in una griglia di 2 coppie etichetta/valore per riga: la prima
   * coppia usa le colonne più larghe, la seconda si distribuisce sul resto
   * del foglio. Così l'intestazione sfrutta la larghezza orizzontale senza
   * costringere a scorrere fino all'ultima colonna della tabella.
   */
  const righeInfo = () => {
    const larghezza = 2 + COLONNE_NUMERICHE; // N. + Giocatore + colonne numeriche
    const righe = [];
    for (let i = 0; i < dati.info.length; i += 2) {
      const gruppo = dati.info.slice(i, i + 2);
      const riga = [];
      gruppo.forEach(([label, value], indice) => {
        // La prima coppia ha il valore più largo (nomi squadra), la seconda
        // l'etichetta più larga (es. "Punti da errori avversari"). Insieme
        // occupano le prime 14 colonne, restando dentro la larghezza di stampa.
        const spanEtichetta = indice === 0 ? 3 : 4;
        const spanValore = indice === 0 ? 4 : 3;
        riga.push(cella(label, { ...stile.etichetta, columnSpan: spanEtichetta }));
        for (let j = 1; j < spanEtichetta; j += 1) riga.push(null);
        riga.push(cella(value, { ...stile.valoreInfo, columnSpan: spanValore }));
        for (let j = 1; j < spanValore; j += 1) riga.push(null);
      });
      while (riga.length < larghezza) riga.push(null);
      righe.push(riga);
    }
    return righe;
  };

  const rigaPunteggio = (valori, stileCella = {}) => {
    const riga = [
      cellaBordata(valori[0], { ...stileCella, columnSpan: 2, align: 'left' }),
      null,
    ];
    valori.slice(1).forEach((voce) => {
      riga.push(cellaBordata(voce, { ...stileCella, columnSpan: 2 }));
      riga.push(null);
    });
    return riga;
  };

  const righeRiconoscimenti = () => {
    const righe = [];
    const stileCella = {
      borderStyle: 'thin',
      borderColor: COL_LINEA_SCURA,
      alignVertical: 'center',
    };
    const bordoSezione = {
      borderStyle: 'medium',
      borderColor: COL_SEZIONE,
    };
    classificheRiconoscimenti(dati.riconoscimenti).forEach(
      ({ label, voci, dettaglio, valore }) => {
        if (voci.length === 0) {
          righe.push([
            cella(label, { ...stile.etichetta, ...bordoSezione, align: 'left' }),
            cella('N/D', {
              ...stileCella,
              ...bordoSezione,
              align: 'left',
              columnSpan: 3,
              textColor: COL_MUTE,
            }),
            null,
            null,
          ]);
          return;
        }
        const posizioni = posizioniClassifica(voci, valore);
        voci.forEach((voce, indice) => {
          righe.push([
            indice === 0
              ? cella(label, {
                  ...stile.etichetta,
                  ...bordoSezione,
                  align: 'left',
                  alignVertical: 'top',
                  rowSpan: voci.length,
                })
              : null,
            cella(String(posizioni[indice]), {
              ...stileCella,
              ...(indice === 0 ? bordoSezione : {}),
              align: 'center',
            }),
            cella(voce.nome, {
              ...stileCella,
              ...(indice === 0 ? bordoSezione : {}),
              align: 'left',
            }),
            cella(dettaglio(voce), {
              ...stileCella,
              ...(indice === 0 ? bordoSezione : {}),
              align: 'center',
            }),
          ]);
        });
      },
    );
    return righe;
  };

  const creaRigheRiepilogo = (datiRiepilogo) => {
    const righe = [rigaSezione('Riepilogo')];
  // Intestazione a due livelli: N. e Giocatore occupano due righe; ogni
  // gruppo è unito sulla sua larghezza (4 esiti, più Pos/Eff dove previste)
  // e ha un bordo sinistro marcato.
    righe.push([
    cella('N.', { ...stile.intestazione, align: 'center', rowSpan: 2 }),
    cella('Giocatore', { ...stile.intestazione, align: 'left', rowSpan: 2 }),
    ...datiRiepilogo.riepilogo.colonne.flatMap((gruppo) => [
      cella(gruppo.label, {
        ...stile.intestazione,
        ...stile.intestazioneGruppo,
        align: 'center',
        columnSpan: gruppo.sotto.length,
      }),
      ...Array.from({ length: gruppo.sotto.length - 1 }, () => null),
    ]),
  ]);
  righe.push([
    null, // coperta da "N." con rowSpan: 2
    null, // coperta da "Giocatore" con rowSpan: 2
    ...datiRiepilogo.riepilogo.colonne.flatMap((gruppo) =>
      gruppo.sotto.map((etichetta, i) =>
        cella(etichetta, {
          ...stile.intestazione,
          ...(i === 0 ? stile.intestazioneGruppo : {}),
          align: 'center',
        }),
      ),
    ),
  ]);
  // Una riga di gruppo per ruolo, poi i giocatori di quel ruolo. Quando non
  // ci sono ruoli (scout dell'avversaria) le righe restano in sequenza.
    if (datiRiepilogo.riepilogo.gruppiRuolo.length > 0) {
      datiRiepilogo.riepilogo.gruppiRuolo.forEach((gruppo) => {
      righe.push([
        cella(gruppo.ruolo.toUpperCase(), {
          fontWeight: 'bold',
          fontSize: 10,
          textColor: COL_TESTO,
          backgroundColor: COL_TOTALE,
          align: 'left',
          alignVertical: 'center',
          borderStyle: 'thin',
          borderColor: COL_LINEA,
            columnSpan: 2 + COLONNE_NUMERICHE,
        }),
        ...Array.from({ length: 1 + COLONNE_NUMERICHE }, () => null),
      ]);
        gruppo.righe.forEach((riga) =>
        righe.push(riga.map((voce, i) => cellaNumero(voce, i))),
        );
      });
    } else {
      datiRiepilogo.riepilogo.righe.forEach((riga) =>
      righe.push(riga.map((voce, i) => cellaNumero(voce, i))),
      );
    }
    righe.push(
      datiRiepilogo.riepilogo.totale.map((voce, i) => cellaNumero(voce, i, stile.totale)),
    );
    righe.push([]);
    righe.push([
      cella(`Legenda: ${ESITI.map((esito) => `${esito.id} ${esito.breve}`).join('  ·  ')}`, {
        textColor: COL_MUTE,
        columnSpan: 2 + COLONNE_NUMERICHE,
      }),
      ...Array.from({ length: 1 + COLONNE_NUMERICHE }, () => null),
    ]);
    return righe;
  };

  const righePartita = [
    [
      cella(dati.titolo, {
        ...stile.titolo,
        columnSpan: 2 + COLONNE_NUMERICHE,
      }),
      ...Array.from({ length: 1 + COLONNE_NUMERICHE }, () => null),
    ],
    [],
    ...righeInfo(),
    [],
    rigaSezione('Punteggio'),
    rigaPunteggio(dati.punteggio.header, stile.intestazione),
    ...dati.punteggio.righe.map((riga) => rigaPunteggio(riga)),
    rigaPunteggio(dati.punteggio.totale, stile.totale),
  ];
  const righeMigliori = [
    [
      cella('Migliori della partita', {
        ...stile.titolo,
        columnSpan: 4,
      }),
      null,
      null,
      null,
    ],
    [
      cella('Classifiche basate sulle azioni registrate nella partita.', {
        textColor: COL_MUTE,
        columnSpan: 4,
      }),
      null,
      null,
      null,
    ],
    [],
    [
      cella('Classifica', { ...stile.intestazione, align: 'left' }),
      cella('Pos.', { ...stile.intestazione, align: 'center' }),
      cella('Giocatore', { ...stile.intestazione, align: 'left' }),
      cella('Valore', { ...stile.intestazione, align: 'center' }),
    ],
    ...righeRiconoscimenti(),
  ];
  const opzioniFoglio = (nome) => ({
    sheet: nome,
    orientation: 'landscape',
    showGridLines: false,
    columns: [
      { width: 6 },
      { width: 26 },
      ...Array.from({ length: COLONNE_NUMERICHE }, () => ({ width: 7.5 })),
    ],
  });
  const opzioniFoglioMigliori = {
    sheet: 'Migliori',
    orientation: 'landscape',
    showGridLines: false,
    columns: [{ width: 38 }, { width: 7 }, { width: 28 }, { width: 14 }],
  };
  const fogli = [
    { data: righePartita, ...opzioniFoglio('Partita') },
    { data: righeMigliori, ...opzioniFoglioMigliori },
    { data: creaRigheRiepilogo(dati), ...opzioniFoglio('Totale giocatori') },
    ...scout.sets.map((set) => {
      const datiSet = costruisciExport(scout, giocatori, squadraNome, set.n);
      return {
        data: creaRigheRiepilogo(datiSet),
        ...opzioniFoglio(`Set ${set.n}`),
      };
    }),
  ];
  const blob = await writeExcelFile(fogli, { fontFamily: 'Calibri', fontSize: 11 }).toBlob();
  scaricaBlob(blob, nomeFileScout(scout, 'xlsx'));
}

/** Esporta il riepilogo in `.pdf` orizzontale (jsPDF + autotable). */
export async function esportaScoutPdf(scout, giocatori, squadraNome) {
  const dati = costruisciExport(scout, giocatori, squadraNome);
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const margine = 14;
  const larghezzaPagina = doc.internal.pageSize.getWidth();
  const larghezzaUtile = larghezzaPagina - margine * 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(testoPdf(dati.titolo), margine, 17);

  // Info della partita su 3 colonne, per sfruttare tutta la larghezza.
  const infoRighe = raggruppaInfo(dati.info, 3);
  const larghezzaInfo = larghezzaUtile / 3;
  const passoInfo = 5.2;
  const inizioInfo = 24;
  doc.setFontSize(9.5);
  infoRighe.forEach((riga, r) => {
    riga.forEach(([label, value], c) => {
      const x = margine + c * larghezzaInfo;
      const y = inizioInfo + r * passoInfo;
      const testoEtichetta = testoPdf(`${label}:`);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COL_TESTO_RGB);
      doc.text(testoEtichetta, x, y);
      const larghezzaEtichetta = doc.getTextWidth(testoEtichetta);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COL_MUTE_RGB);
      doc.text(testoPdf(value), x + larghezzaEtichetta + 1.5, y);
    });
  });

  const lineaInfo = inizioInfo + infoRighe.length * passoInfo + 0.5;
  doc.setDrawColor(...COL_LINEA_RGB);
  doc.setLineWidth(0.25);
  doc.line(margine, lineaInfo, larghezzaPagina - margine, lineaInfo);

  const stileTabella = {
    theme: 'grid',
    margin: { left: margine, right: margine },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 2.5,
      lineColor: COL_LINEA_RGB,
      lineWidth: 0.1,
      textColor: COL_TESTO_RGB,
    },
    headStyles: {
      fillColor: COL_INTTESTAZIONE_RGB,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
      lineWidth: 0.1,
      lineColor: [63, 63, 70],
    },
    footStyles: {
      fillColor: COL_TOTALE_RGB,
      textColor: COL_TESTO_RGB,
      fontStyle: 'bold',
      lineWidth: 0.1,
      lineColor: COL_LINEA_RGB,
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
  };

  // Pagina 1: dati anagrafici della partita e punteggio dei set.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COL_TESTO_RGB);
  doc.text(testoPdf('Punteggio per set'), margine, lineaInfo + 8);

  autoTable(doc, {
    ...stileTabella,
    styles: { ...stileTabella.styles, fontSize: 10.5, cellPadding: 3.2 },
    startY: lineaInfo + 11,
    head: [dati.punteggio.header],
    body: dati.punteggio.righe.map((riga) => riga.map((voce) => testoPdf(voce))),
    foot: [dati.punteggio.totale.map((voce) => testoPdf(voce))],
  });

  // Pagina 2: tutti i riconoscimenti su una pagina dedicata, così le sei
  // classifiche restano visibili insieme senza spezzarsi.
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COL_TESTO_RGB);
  doc.text(testoPdf('Migliori della partita'), margine, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COL_MUTE_RGB);
  doc.text(
    testoPdf(
      [dati.titolo, toItalianDate(scout.data), squadraNome].filter(Boolean).join('  ·  '),
    ),
    margine,
    20.5,
  );

  const classifiche = classificheRiconoscimenti(dati.riconoscimenti);
  const corpoRiconoscimenti = classifiche.flatMap(({ label, voci, dettaglio, valore }) => {
    if (voci.length === 0) {
      return [
        [
          {
            content: testoPdf(label),
            isCategoria: true,
            rowSpan: 1,
            styles: { fontStyle: 'bold', fillColor: COL_TOTALE_RGB, valign: 'top' },
          },
          { content: 'N/D', colSpan: 3, styles: { halign: 'left' } },
        ],
      ];
    }
    const posizioni = posizioniClassifica(voci, valore);
    return voci.map((voce, indice) => {
      const riga = [];
      if (indice === 0) {
        riga.push({
          content: testoPdf(label),
          isCategoria: true,
          rowSpan: voci.length,
          styles: { fontStyle: 'bold', fillColor: COL_TOTALE_RGB, valign: 'top' },
        });
      }
      riga.push({ content: String(posizioni[indice]), styles: { halign: 'center' } });
      riga.push({ content: testoPdf(voce.nome), styles: { halign: 'left' } });
      riga.push({ content: testoPdf(dettaglio(voce)), styles: { halign: 'center' } });
      return riga;
    });
  });

  // Riduce il font se i pari merito allungano le classifiche: la pagina
  // dedicata deve contenerle tutte senza spezzarsi.
  const altezzaPagina = doc.internal.pageSize.getHeight();
  const altezzaDisponibile = altezzaPagina - 26 - 12 - 6;
  const numeroRighe = corpoRiconoscimenti.length + 1;
  let fontSize = 9.5;
  let cellPadding = 2.5;
  const altezzaStimata = () =>
    numeroRighe * (fontSize * 0.3528 * 1.22 + cellPadding * 2 + 0.2);
  while (altezzaStimata() > altezzaDisponibile && fontSize > 5.5) {
    fontSize = Math.max(5.5, Number((fontSize - 0.25).toFixed(2)));
    cellPadding = Math.max(0.6, Number((fontSize * 0.22).toFixed(2)));
  }

  autoTable(doc, {
    ...stileTabella,
    startY: 26,
    styles: {
      ...stileTabella.styles,
      fontSize,
      cellPadding,
      overflow: 'linebreak',
      lineColor: COL_LINEA_SCURA_RGB,
      lineWidth: 0.15,
    },
    head: [
      [
        { content: 'Classifica', styles: { halign: 'left' } },
        { content: 'Pos.', styles: { halign: 'center' } },
        { content: 'Giocatore', styles: { halign: 'left' } },
        { content: 'Valore', styles: { halign: 'center' } },
      ],
    ],
    body: corpoRiconoscimenti,
    columnStyles: {
      0: { cellWidth: 58, valign: 'top' },
      1: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 'auto', halign: 'left' },
      3: { cellWidth: 38, halign: 'center' },
    },
    // Linea più marcata all'inizio di ogni classifica, per separare le sezioni.
    didDrawCell: (data) => {
      if (data.section !== 'body' || !data.cell.raw?.isCategoria) return;
      doc.setDrawColor(...COL_SEZIONE_RGB);
      doc.setLineWidth(0.6);
      doc.line(margine, data.cell.y, larghezzaPagina - margine, data.cell.y);
    },
    rowPageBreak: 'avoid',
  });

  /**
   * Cella del riepilogo PDF: numeri colorati per esito, percentuali con il
   * segno (verde sopra zero, rosso sotto zero), grigi quando zero o assenti.
   */
  const cellaPdf = (voce, i) => {
    if (i === 0) {
      return { content: String(voce), styles: { halign: 'center' } };
    }
    if (i === 1) {
      return { content: testoPdf(voce), styles: { halign: 'left' } };
    }
    const descrittore = DESCRITTORI_COLONNA[i - PRIMA_COLONNA_ESITI];
    if (descrittore?.percentuale) {
      return {
        content: voce === null || voce === undefined ? '—' : `${voce}%`,
        styles: {
          halign: 'center',
          textColor:
            voce > 0
              ? COL_ESITI_RGB['#']
              : voce < 0
                ? COL_ESITI_RGB['=']
                : COL_MUTE_RGB,
        },
      };
    }
    return {
      content: String(voce),
      styles: {
        halign: 'center',
        textColor: voce > 0 ? COL_ESITI_RGB[descrittore?.esito] : COL_MUTE_RGB,
      },
    };
  };

  const renderPaginaRiepilogo = (datiPagina, titoloPagina, sottotitolo) => {
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...COL_TESTO_RGB);
    doc.text(testoPdf(titoloPagina), margine, 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COL_MUTE_RGB);
    doc.text(testoPdf(sottotitolo), margine, 20.5);

    const inizioTabella = 26;
    const altezzaPagina = doc.internal.pageSize.getHeight();
    const margineInferiore = 12;
    const spazioLegenda = 10;
    const altezzaDisponibile = altezzaPagina - inizioTabella - margineInferiore - spazioLegenda;
    const righeCorpo =
      datiPagina.riepilogo.gruppiRuolo.length > 0
        ? datiPagina.riepilogo.gruppiRuolo.reduce(
            (somma, gruppo) => somma + 1 + gruppo.righe.length,
            0,
          )
        : datiPagina.riepilogo.righe.length;
    const numeroRighe = righeCorpo + 3;
    let fontSize = 8.5;
    let cellPadding = 1.9;
    const altezzaStimata = () => numeroRighe * (fontSize * 0.3528 * 1.15 + cellPadding * 2);
    while (altezzaStimata() > altezzaDisponibile && fontSize > 4.5) {
      fontSize = Math.max(4.5, Number((fontSize - 0.25).toFixed(2)));
      cellPadding = Math.max(0.6, Number((fontSize * 0.22).toFixed(2)));
    }

    const corpo = [];
    if (datiPagina.riepilogo.gruppiRuolo.length > 0) {
      datiPagina.riepilogo.gruppiRuolo.forEach((gruppo) => {
        corpo.push([
          {
            content: testoPdf(gruppo.ruolo.toUpperCase()),
            colSpan: 2 + COLONNE_NUMERICHE,
            styles: {
              halign: 'left',
              fontStyle: 'bold',
              fontSize: Math.max(6, Number((fontSize - 0.3).toFixed(2))),
              fillColor: COL_TOTALE_RGB,
              textColor: COL_TESTO_RGB,
            },
          },
        ]);
        gruppo.righe.forEach((riga) => corpo.push(riga.map(cellaPdf)));
      });
    } else {
      datiPagina.riepilogo.righe.forEach((riga) => corpo.push(riga.map(cellaPdf)));
    }

    autoTable(doc, {
      ...stileTabella,
      margin: { left: margine, right: margine, bottom: margineInferiore },
      styles: { ...stileTabella.styles, fontSize, cellPadding },
      startY: inizioTabella,
      rowPageBreak: 'avoid',
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 52, halign: 'left' },
      },
      head: [
        [
          { content: 'N.', rowSpan: 2, styles: { halign: 'center' } },
          { content: 'Giocatore', rowSpan: 2, styles: { halign: 'left' } },
          ...datiPagina.riepilogo.colonne.map((gruppo) => ({
            content: gruppo.label,
            colSpan: gruppo.sotto.length,
            styles: { halign: 'center' },
          })),
        ],
        [
          ...datiPagina.riepilogo.colonne.flatMap((gruppo) =>
            gruppo.sotto.map((etichetta) => ({
              content: etichetta,
              styles: { halign: 'center' },
            })),
          ),
        ],
      ],
      body: corpo,
      foot: [datiPagina.riepilogo.totale.map(cellaPdf)],
      didDrawCell: (data) => {
        if (!apreGruppo(data.column.index)) return;
        const { x, y, height } = data.cell;
        doc.setDrawColor(...(data.section === 'head' ? [255, 255, 255] : COL_INTTESTAZIONE_RGB));
        doc.setLineWidth(0.7);
        doc.line(x, y, x, y + height);
      },
    });

    doc.setFontSize(8);
    doc.setTextColor(...COL_MUTE_RGB);
    doc.text(
      testoPdf(`Legenda: ${ESITI.map((esito) => `${esito.id} ${esito.breve}`).join('  ·  ')}`),
      margine,
      Math.min(doc.lastAutoTable.finalY + 5, altezzaPagina - 7),
    );
  };

  renderPaginaRiepilogo(
    dati,
    'Riepilogo giocatori',
    [dati.titolo, toItalianDate(scout.data), squadraNome].filter(Boolean).join('  ·  '),
  );
  scout.sets.forEach((set) => {
    const datiSet = costruisciExport(scout, giocatori, squadraNome, set.n);
    renderPaginaRiepilogo(
      datiSet,
      `Riepilogo giocatori - Set ${set.n}`,
      [dati.titolo, `Set ${set.n}`, toItalianDate(scout.data)].filter(Boolean).join('  ·  '),
    );
  });

  scaricaBlob(doc.output('blob'), nomeFileScout(scout, 'pdf'));
}
