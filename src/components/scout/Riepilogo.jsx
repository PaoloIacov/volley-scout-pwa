import { ClipboardList } from 'lucide-react';
import { Card } from '../ui.jsx';
import { AZIONI, ESITI, ESITO_CLASSI, costruisciRiepilogo } from '../../lib/scout-stats.js';

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
 * più la riga con i totali della squadra.
 */
export default function Riepilogo({ scout, giocatori }) {
  const { righe, totali } = costruisciRiepilogo(scout, giocatori);
  const totaleGenerale = AZIONI.reduce((somma, azione) => somma + totali[azione.id].tot, 0);

  if (righe.length === 0) {
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
  );
}
