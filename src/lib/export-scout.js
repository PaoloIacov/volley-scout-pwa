/* Esportazione dello scout in Excel (.xlsx) e PDF: contenuto sintetico
   (info partita, punteggi dei set e tabella riepilogo per giocatore, con
   ogni colonna — Tot compresa — suddivisa nelle 4 sotto-colonne di esito).
   Le librerie vengono caricate dinamicamente all'export, così non pesano
   sul caricamento iniziale dell'app. */
import { toItalianDate } from './dates.js';
import {
  AZIONI,
  ESITI,
  costruisciRiepilogo,
  contaErroriAvversari,
  contaGenerici,
} from './scout-stats.js';

/** Colori dell'export, allineati al tema dell'app. */
const COL_INTTESTAZIONE = '#18181b';
const COL_INTTESTAZIONE_RGB = [24, 24, 27];
const COL_TOTALE = '#f4f4f5';
const COL_TOTALE_RGB = [244, 244, 245];
const COL_TESTO_RGB = [24, 24, 27];
const COL_MUTE_RGB = [113, 113, 122];
const COL_LINEA_RGB = [228, 228, 231];
const COL_MUTE = '#71717a';
/** Colori degli esiti, allineati ai token del tema chiaro dell'app. */
const COL_ESITI = { '#': '#059669', '+': '#0284c7', '-': '#d97706', '=': '#dc2626' };
const COL_ESITI_RGB = {
  '#': [5, 150, 105],
  '+': [2, 132, 199],
  '-': [217, 119, 6],
  '=': [220, 38, 38],
};

/**
 * Dati dell'export in blocchi pronti: `info` (righe etichetta/valore),
 * `punteggio` e `riepilogo` (gruppi + esiti per l'intestazione a due
 * livelli, righe e totale con un numero per ogni sotto-colonna).
 *
 * @param {object} scout record scout
 * @param {Array} giocatori rosa della squadra che possiede lo scout
 * @param {string} squadraNome nome della squadra (per l'info)
 */
export function costruisciExport(scout, giocatori = [], squadraNome = '') {
  const { righe, totali, totaliPerEsito } = costruisciRiepilogo(scout, giocatori);

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

  /** Riga del riepilogo: 4 colonne per esito per ogni azione, poi il Tot. */
  const numeriRiga = (celle, perEsito) => [
    ...AZIONI.flatMap((azione) => ESITI.map(({ id }) => celle[azione.id][id])),
    ...ESITI.map(({ id }) => perEsito[id]),
  ];

  return {
    titolo: scout.avversario ? `Scout vs ${scout.avversario}` : 'Scout',
    info,
    punteggio: {
      header: ['Set', 'Noi', 'Loro'],
      righe: scout.sets.map((set) => [`Set ${set.n}`, set.nostro, set.loro]),
      totale: ['Set vinti', setNostri, setLoro],
    },
    riepilogo: {
      // Stesso schema della tabella in app: ogni gruppo vale 4 colonne, una per esito.
      gruppi: ['Giocatore', ...AZIONI.map((azione) => azione.label), 'Tot'],
      esiti: ESITI.map(({ id }) => id),
      righe: righe.map((riga) => [
        riga.nome ? `${riga.nome} (N. ${riga.numero})` : `N. ${riga.numero}`,
        ...numeriRiga(riga.celle, riga.perEsito),
      ]),
      totale: ['Totale', ...numeriRiga(totali, totaliPerEsito)],
    },
  };
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
    titolo: { fontWeight: 'bold', fontSize: 15 },
    sezione: { fontWeight: 'bold', fontSize: 13 },
    etichetta: { fontWeight: 'bold' },
    intestazione: {
      fontWeight: 'bold',
      textColor: '#ffffff',
      backgroundColor: COL_INTTESTAZIONE,
    },
    totale: { fontWeight: 'bold', backgroundColor: COL_TOTALE },
    headerRow: (row) =>
      row.map((voce, i) =>
        cella(voce, { ...stile.intestazione, align: i === 0 ? 'left' : 'center' }),
      ),
  };

  /** Numero del riepilogo: colorato per esito, grigio quando è zero. */
  const cellaNumero = (value, colonna) => {
    if (colonna === 0) return cella(value);
    const esito = dati.riepilogo.esiti[(colonna - 1) % ESITI.length];
    return { value, align: 'center', textColor: value > 0 ? COL_ESITI[esito] : COL_MUTE };
  };

  const righe = [];
  righe.push([cella(dati.titolo, stile.titolo)]);
  righe.push([]);
  dati.info.forEach(([label, value]) => righe.push([cella(label, stile.etichetta), cella(value)]));
  righe.push([]);
  righe.push([cella('Punteggio', stile.sezione)]);
  righe.push(stile.headerRow(dati.punteggio.header));
  dati.punteggio.righe.forEach((riga) => righe.push(riga.map((voce) => cella(voce))));
  righe.push(dati.punteggio.totale.map((voce) => cella(voce, stile.totale)));
  righe.push([]);
  righe.push([cella('Riepilogo', stile.sezione)]);
  // Intestazione a due livelli: gruppi uniti su 4 colonne + la riga dei 4 esiti.
  righe.push([
    cella('Giocatore', { ...stile.intestazione, align: 'left', rowSpan: 2 }),
    ...dati.riepilogo.gruppi
      .slice(1)
      .flatMap((etichetta) => [
        cella(etichetta, { ...stile.intestazione, align: 'center', columnSpan: 4 }),
        null,
        null,
        null,
      ]),
  ]);
  righe.push([
    null, // coperta dal "Giocatore" con rowSpan: 2
    ...dati.riepilogo.gruppi
      .slice(1)
      .flatMap(() => dati.riepilogo.esiti.map((esito) => cella(esito, stile.intestazione))),
  ]);
  dati.riepilogo.righe.forEach((riga) => righe.push(riga.map((voce, i) => cellaNumero(voce, i))));
  righe.push(
    dati.riepilogo.totale.map((voce, i) => ({ ...cellaNumero(voce, i), ...stile.totale })),
  );

  const blob = await writeExcelFile(
    righe,
    {
      sheet: 'Scout',
      // Colonna giocatore larga, poi 20 colonne strette (5 gruppi × 4 esiti).
      columns: [{ width: 28 }, ...Array.from({ length: 20 }, () => ({ width: 7.5 }))],
    },
    { fontFamily: 'Calibri', fontSize: 11 },
  ).toBlob();
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

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(testoPdf(dati.titolo), margine, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COL_MUTE_RGB);
  dati.info.forEach(([label, value], index) => {
    doc.text(testoPdf(`${label}: ${value}`), margine, 24 + index * 5);
  });

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
      lineWidth: 0,
    },
    footStyles: {
      fillColor: COL_TOTALE_RGB,
      textColor: COL_TESTO_RGB,
      fontStyle: 'bold',
      lineWidth: 0,
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
  };

  autoTable(doc, {
    ...stileTabella,
    startY: 24 + dati.info.length * 5 + 3,
    head: [dati.punteggio.header],
    body: dati.punteggio.righe.map((riga) => riga.map((voce) => testoPdf(voce))),
    foot: [dati.punteggio.totale.map((voce) => testoPdf(voce))],
  });

  /** Cella del riepilogo PDF: numeri colorati per esito, grigi quando zero. */
  const cellaPdf = (voce, i) => {
    if (i === 0) return { content: testoPdf(voce), styles: { halign: 'left' } };
    const esito = dati.riepilogo.esiti[(i - 1) % ESITI.length];
    return {
      content: String(voce),
      styles: { halign: 'center', textColor: voce > 0 ? COL_ESITI_RGB[esito] : COL_MUTE_RGB },
    };
  };

  autoTable(doc, {
    ...stileTabella,
    styles: { ...stileTabella.styles, fontSize: 8.5, cellPadding: 2 },
    startY: doc.lastAutoTable.finalY + 6,
    head: [
      [
        { content: 'Giocatore', rowSpan: 2, styles: { halign: 'left' } },
        ...dati.riepilogo.gruppi.slice(1).map((etichetta) => ({
          content: etichetta,
          colSpan: 4,
          styles: { halign: 'center' },
        })),
      ],
      // La colonna "Giocatore" è coperta dal rowSpan della riga sopra.
      dati.riepilogo.esiti.flatMap(() =>
        dati.riepilogo.esiti.map((esito) => ({ content: esito, styles: { halign: 'center' } })),
      ),
    ],
    body: dati.riepilogo.righe.map((riga) => riga.map(cellaPdf)),
    foot: [dati.riepilogo.totale.map(cellaPdf)],
  });

  doc.setFontSize(8.5);
  doc.setTextColor(...COL_MUTE_RGB);
  doc.text(
    testoPdf(`Legenda: ${ESITI.map((esito) => `${esito.id} ${esito.breve}`).join('  ·  ')}`),
    margine,
    doc.lastAutoTable.finalY + 7,
  );

  scaricaBlob(doc.output('blob'), nomeFileScout(scout, 'pdf'));
}
