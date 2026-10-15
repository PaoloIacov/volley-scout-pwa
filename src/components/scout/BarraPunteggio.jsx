import { Plus } from 'lucide-react';
import { Card, IconButton } from '../ui.jsx';
import { SET_MASSIMO } from '../../services/scout.js';

function clampPunteggio(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), 999);
}

/**
 * Punteggio del set corrente, sempre visibile (sticky sotto l'header):
 * set selezionabile a chip, punti modificabili con +/- o scrivendo il numero.
 */
export default function BarraPunteggio({
  scout,
  onCambiaPunteggio,
  onDeltaPunteggio,
  onSelezionaSet,
  onAggiungiSet,
}) {
  const setAttivo = scout.sets.find((set) => set.n === scout.setCorrente) ?? scout.sets[0];
  const piuSet = scout.sets.length < SET_MASSIMO;

  const squadre = [
    { campo: 'nostro', label: 'Noi', aria: 'nostro' },
    { campo: 'loro', label: 'Loro', aria: 'avversario' },
  ];

  return (
    <Card className="sticky top-16 z-30 p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-ink-mute">
            Set
          </span>
          {scout.sets.map((set) => {
            const attivo = set.n === setAttivo.n;
            return (
              <button
                key={set.n}
                type="button"
                aria-label={`Set ${set.n}`}
                aria-pressed={attivo}
                onClick={() => onSelezionaSet(set.n)}
                className={`flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-sm transition-colors duration-150 ${
                  attivo
                    ? 'border-accent bg-accent text-on-accent shadow-lg shadow-accent/25'
                    : 'border-line-strong bg-panel-2 text-ink-soft hover:text-ink'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                  {set.n}
                </span>
                <span className="font-semibold tabular-nums">
                  {set.nostro}-{set.loro}
                </span>
              </button>
            );
          })}
          <IconButton
            label="Aggiungi set"
            onClick={onAggiungiSet}
            disabled={!piuSet}
            className="h-10 w-10"
          >
            <Plus size={16} />
          </IconButton>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:w-[460px] xl:w-[520px]">
          {squadre.map(({ campo, label, aria }) => (
            <div key={campo} className="rounded-2xl border border-line bg-panel-2 p-2.5">
              <p className="mb-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
                {label}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`Togli punto a ${label}`}
                  onClick={() => onDeltaPunteggio(setAttivo.n, campo, -1)}
                  className="flex h-12 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line-strong bg-panel text-xl font-bold text-ink-soft transition-colors duration-150 hover:border-ink-faint hover:text-ink"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  max={999}
                  inputMode="numeric"
                  aria-label={`Punteggio ${aria}`}
                  className="h-12 w-full min-w-0 rounded-xl border border-line-strong bg-panel text-center text-2xl font-bold text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  value={setAttivo[campo]}
                  onChange={(e) =>
                    onCambiaPunteggio(setAttivo.n, campo, clampPunteggio(e.target.value))
                  }
                />
                <button
                  type="button"
                  aria-label={`Aggiungi punto a ${label}`}
                  onClick={() => onDeltaPunteggio(setAttivo.n, campo, 1)}
                  className="flex h-12 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line-strong bg-panel text-xl font-bold text-ink-soft transition-colors duration-150 hover:border-ink-faint hover:text-ink"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
