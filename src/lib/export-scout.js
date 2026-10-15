/* Esportazione dello scout in Excel (.xlsx) e PDF: contenuto sintetico
   (info partita, punteggi dei set e tabella riepilogo per giocatore).
   Le librerie vengono caricate dinamicamente all'export, così non pesano
   sul caricamento iniziale dell'app. */
import { toItalianDate } from './dates.js';
import { AZIONI, ESITI, costruisciRiepilogo, contaGenerici } from './scout-stats.js';

/** Colori dell'export, allineati al tema dell'app. */
const COL_INTTESTAZIONE = '#18181b';
const COL_INTTESTAZIONE_RGB = [24, 24, 27];
const COL_TOTALE = '#f4f4f5';
const COL_TOTALE_RGB = [244, 244, 245];
const COL_TESTO_RGB = [24, 24, 27];
const COL_MUTE_RGB = [113, 113, 122];
const COL_LINEA_RGB = [228, 228, 231];

/** Testo di una cella del riepilogo: totale + dettaglio degli esiti. */
function cellaTesto(cella) {
  if (!cella || !cella.tot) return '';
  const dettaglio = ESITI.filter(({ id }) => cella[id] > 0)
    .map(({ id }) => `${cella[id]}${id}`)
    .join(' ');
  return `${cella.tot} (${dettaglio})`;
}

/**
 * Dati dell'export in blocchi pronti: `info` (righe etichetta/valore),
 * `punteggio` e `riepilogo` (header + righe + riga totale).
 *
 * @param {object} scout record scout
 * @param {Array} giocatori rosa della squadra che possiede lo scout
 * @param {string} squadraNome nome della squadra (per l'info)
 */
export function costruisciExport(scout, giocatori = [], squadraNome = '') {
  const { righe, totali } = costruisciRiepilogo(scout, giocatori);

  const osservata =
    scout.squadraOsservata === 'avversaria' ? 'Avversaria' : squadraNome || 'Propria';
  const info = [
    ['Squadra', squadraNome],
    ['Avversario', scout.avversario],
    ['Data', toItalianDate(scout.data)],
    ['Orario', scout.orarioInizio],
    ['Luogo', scout.luogo],
    ['Squadra osservata', osservata],
    ['Azioni rilevate', scout.azioni.length],
    ['Errori generici', contaGenerici(scout)],
  ].filter(([, value]) => value !== '' && value !== null && value !== undefined);

  let setNostri = 0;
  let setLoro = 0;
  scout.sets.forEach((set) => {
    if (set.nostro > set.loro) setNostri += 1;
    else if (set.loro > set.nostro) setLoro += 1;
  });

  const totaleGenerale = AZIONI.reduce((somma, azione) => somma + totali[azione.id].tot, 0);

  return {
    titolo: scout.avversario ? `Scout vs ${scout.avversario}` : 'Scout',
    info,
    punteggio: {
      header: ['Set', 'Noi', 'Loro'],
      righe: scout.sets.map((set) => [`Set ${set.n}`, set.nostro, set.loro]),
      totale: ['Set vinti', setNostri, setLoro],
    },
    riepilogo: {
      header: ['Giocatore', ...AZIONI.map((azione) => azione.label), 'Tot'],
      righe: righe.map((riga) => [
        riga.nome ? `${riga.nome} (N. ${riga.numero})` : `N. ${riga.numero}`,
        ...AZIONI.map((azione) => cellaTesto(riga.celle[azione.id])),
        riga.tot,
      ]),
      totale: ['Totale', ...AZIONI.map((azione) => cellaTesto(totali[azione.id])), totaleGenerale],
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
  righe.push(stile.headerRow(dati.riepilogo.header));
  dati.riepilogo.righe.forEach((riga) => righe.push(riga.map((voce) => cella(voce))));
  righe.push(dati.riepilogo.totale.map((voce) => cella(voce, stile.totale)));

  const blob = await writeExcelFile(
    righe,
    {
      sheet: 'Scout',
      columns: [
        { width: 30 },
        { width: 16 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 10 },
      ],
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

  autoTable(doc, {
    ...stileTabella,
    startY: doc.lastAutoTable.finalY + 6,
    head: [dati.riepilogo.header],
    body: dati.riepilogo.righe.map((riga) => riga.map((voce) => testoPdf(voce))),
    foot: [dati.riepilogo.totale.map((voce) => testoPdf(voce))],
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
