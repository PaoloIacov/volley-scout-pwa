import { useState } from 'react';
import { ClipboardList, FileDown, FileSpreadsheet } from 'lucide-react';
import { useToast } from '../Toast.jsx';
import { Button, Card } from '../ui.jsx';
import {
  AZIONI,
  ESITI,
  ESITO_CLASSI,
  costruisciRiepilogo,
  contaGenerici,
  genericiPerSet,
} from '../../lib/scout-stats.js';
import { esportaScoutExcel, esportaScoutPdf } from '../../lib/export-scout.js';

/** Cella della tabella: totale + conteggi per esito (solo i diversi da zero). */
function Cella({ cella }) {
  if (!cella || !cella.tot) {
    return <td className="px-3 py-2.5 text-center text-ink-faint">·</td>;
  }
  return (
    <td className="px-3 py-2.5 text-center align-top">
      <span className="text-sm font-semibold text-ink tabular-nums">{cella.tot}</span>
      <span className="mt-1 flex flex-wrap justify-center gap-1">
        {ESITI.map(({ id }) =>
          cella[id] > 0 ? (
            <span
              key={id}
              className={`inline-flex h-4 items-center justify-center rounded px-1 text-[10px] font-bold tabular-nums ${ESITO_CLASSI[id].tondo}`}
            >
              {cella[id]}
              {id}
            </span>
          ) : null,
        )}
      </span>
    </td>
  );
}

/**
 * Riepilogo parziale: tabella giocatore × azione con esiti,
 * più la riga con i totali della squadra. Da qui si esporta
 * il riepilogo sintetico in Excel o PDF.
 */
export default function Riepilogo({ scout, giocatori, squadraNome = '' }) {
  const toast = useToast();
  const [esportando, setEsportando] = useState('');
  const { righe, totali } = costruisciRiepilogo(scout, giocatori);
  const totaleGenerale = AZIONI.reduce((somma, azione) => somma + totali[azione.id].tot, 0);
  const generici = genericiPerSet(scout);
  const totGenerici = contaGenerici(scout);

  /** Genera e scarica il file: il formato resta attivo mentre si lavora. */
  const esporta = async (formato) => {
    setEsportando(formato);
    try {
      if (formato === 'excel') {
        await esportaScoutExcel(scout, giocatori, squadraNome);
        toast.show('Riepilogo esportato in Excel.');
      } else {
        await esportaScoutPdf(scout, giocatori, squadraNome);
        toast.show('Riepilogo esportato in PDF.');
      }
    } catch (errore) {
      console.error('Esportazione fallita', errore);
      toast.show('Esportazione non riuscita: riprova.', 'error');
    } finally {
      setEsportando('');
    }
  };

  if (righe.length === 0 && totGenerici === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-panel-2 text-ink-soft ring-1 ring-line">
          <ClipboardList size={26} />
        </div>
        <p className="font-medium text-ink">Nessun dato rilevato</p>
        <p className="max-w-sm text-sm text-ink-mute">
          Passa alla tab Inserimento: i dati registrati compariranno qui in tempo reale.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => esporta('excel')}
          disabled={esportando !== ''}
          title="Esporta il riepilogo in Excel (.xlsx)"
        >
          <FileSpreadsheet size={15} />
          {esportando === 'excel' ? 'Esporto…' : 'Excel'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => esporta('pdf')}
          disabled={esportando !== ''}
          title="Esporta il riepilogo in PDF"
        >
          <FileDown size={15} />
          {esportando === 'pdf' ? 'Esporto…' : 'PDF'}
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-line bg-panel-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
                <th scope="col" className="px-4 py-3">
                  Giocatore
                </th>
                {AZIONI.map((azione) => (
                  <th key={azione.id} scope="col" className="px-3 py-3 text-center">
                    {azione.label}
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-center">
                  Tot
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {righe.map((riga) => (
                <tr key={riga.numero}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-panel-2 text-sm font-bold text-ink ring-1 ring-line-strong tabular-nums">
                        {riga.numero}
                      </span>
                      {riga.nome && (
                        <span className="min-w-0 truncate text-sm text-ink">{riga.nome}</span>
                      )}
                    </div>
                  </td>
                  {AZIONI.map((azione) => (
                    <Cella key={azione.id} cella={riga.celle[azione.id]} />
                  ))}
                  <td className="px-4 py-2.5 text-center text-sm font-bold text-ink tabular-nums">
                    {riga.tot}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line bg-panel-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
                <td className="px-4 py-3">Totale</td>
                {AZIONI.map((azione) => (
                  <Cella key={azione.id} cella={totali[azione.id]} />
                ))}
                <td className="px-4 py-3 text-center text-sm font-bold text-ink tabular-nums">
                  {totaleGenerale}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="border-t border-line px-4 py-3 text-xs">
          <span className="font-semibold uppercase tracking-wider text-ink-mute">
            Errori generici:
          </span>{' '}
          <span className="font-bold text-ink tabular-nums">{totGenerici}</span>
          {generici.map((voce) => (
            <span key={voce.set} className="text-ink-mute">
              {' · set '}
              {voce.set}: {voce.n}
            </span>
          ))}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line px-4 py-3 text-xs text-ink-mute">
          <span className="font-semibold uppercase tracking-wider">Legenda:</span>
          {ESITI.map((esito) => (
            <span key={esito.id} className="inline-flex items-center gap-1.5">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold ${ESITO_CLASSI[esito.id].tondo}`}
              >
                {esito.id}
              </span>
              {esito.breve}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
