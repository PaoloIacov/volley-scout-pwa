import { useMemo, useState } from 'react';
import { Minus, Plus, SlidersHorizontal } from 'lucide-react';
import { AZIONI, ESITI } from '../../lib/scout-stats.js';
import { Button, Modal } from '../ui.jsx';

export default function ModificaGiocatoreModal({
  open,
  numero,
  nome = '',
  scout,
  onClose,
  onAggiungi,
  onRimuovi,
}) {
  const [setN, setSetN] = useState(String(scout?.setCorrente ?? 1));
  const azioni = useMemo(
    () =>
      (Array.isArray(scout?.azioni) ? scout.azioni : []).filter(
        (azione) => Number(azione.numero) === Number(numero),
      ),
    [scout, numero],
  );

  const conta = (azione, esito) =>
    azioni.filter(
      (voce) =>
        Number(voce.set) === Number(setN) && voce.azione === azione && voce.esito === esito,
    ).length;
  const rimuovi = (azione, esito) => {
    const voce = [...azioni]
      .reverse()
      .find(
        (elemento) =>
          Number(elemento.set) === Number(setN) &&
          elemento.azione === azione &&
          elemento.esito === esito,
      );
    if (voce) onRimuovi?.(voce.id);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Modifica dati${nome ? ` · ${nome}` : ` · N. ${numero}`}`}
      icon={SlidersHorizontal}
      footer={
        <Button variant="outline" onClick={onClose}>
          Chiudi
        </Button>
      }
    >
      <p className="text-sm text-ink-soft">
        Modifica liberamente i conteggi nel set selezionato. Le modifiche vengono applicate anche
        ai totali della partita.
      </p>

      <label className="mt-4 block text-sm font-medium text-ink-soft" htmlFor="set-modifica">
        Set da modificare
      </label>
      <select
        id="set-modifica"
        className="mt-1.5 w-full rounded-xl border border-line-strong bg-panel-2 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        value={setN}
        onChange={(event) => setSetN(event.target.value)}
      >
        {(scout?.sets ?? []).map((set) => (
          <option key={set.n} value={set.n}>
            Set {set.n}
          </option>
        ))}
      </select>

      <div className="mt-4 space-y-3">
        {AZIONI.map((azione) => (
          <section
            key={azione.id}
            className="min-w-0 overflow-hidden rounded-xl border border-line-strong bg-panel-2 p-3"
          >
            <h3 className="text-sm font-semibold text-ink">{azione.label}</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ESITI.map((esito) => {
                const valore = conta(azione.id, esito.id);
                return (
                  <div
                    key={esito.id}
                className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 rounded-lg border border-line bg-panel px-1.5 py-1.5"
                  >
                    <span
                      className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-xs font-bold ring-1 ${
                        esito.id === '#'
                          ? 'text-ok bg-ok/10 ring-ok/30'
                          : esito.id === '+'
                            ? 'text-info bg-info/10 ring-info/30'
                            : esito.id === '-'
                              ? 'text-warn bg-warn/10 ring-warn/30'
                              : 'text-ko bg-ko/10 ring-ko/30'
                      }`}
                    >
                      {esito.id}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-ink">{valore}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        aria-label={`Diminuisci ${azione.label} ${esito.id}`}
                        disabled={valore === 0}
                        onClick={() => rimuovi(azione.id, esito.id)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-ink-soft hover:bg-panel-2 disabled:pointer-events-none disabled:opacity-30"
                      >
                        <Minus size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Aumenta ${azione.label} ${esito.id}`}
                        onClick={() => onAggiungi?.(numero, azione.id, esito.id, Number(setN))}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-ink-soft hover:bg-panel-2"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </Modal>
  );
}
