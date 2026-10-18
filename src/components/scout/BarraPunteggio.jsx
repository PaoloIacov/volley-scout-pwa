import { Plus, X } from 'lucide-react';
import { Card, IconButton } from '../ui.jsx';
import { SET_MASSIMO } from '../../services/scout.js';

function clampPunteggio(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), 999);
}

const BTN_PUNTO =
  'flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-base font-bold leading-none text-ink-soft transition-colors duration-150 hover:bg-panel hover:text-ink sm:h-9 sm:w-9 sm:text-lg';

/**
 * Punteggio del set corrente, sempre visibile (sticky sotto l'header) ma in
 * riga compatta: sul tablet deve occupare il minimo spazio possibile, perché
 * il dato principale della schermata sono i rilevamenti statistici.
 * Set a chip, punti con +/- o scrivendo il numero.
 */
export default function BarraPunteggio({
  scout,
  onCambiaPunteggio,
  onDeltaPunteggio,
  onSelezionaSet,
  onAggiungiSet,
  onErroreGenerico,
  onEliminaSet,
}) {
  const setAttivo = scout.sets.find((set) => set.n === scout.setCorrente) ?? scout.sets[0];
  const piuSet = scout.sets.length < SET_MASSIMO;

  const squadre = [
    { campo: 'nostro', label: 'Noi', aria: 'nostro' },
    { campo: 'loro', label: 'Loro', aria: 'avversario' },
  ];

  return (
    <Card className="sticky top-16 z-30 flex flex-wrap items-center gap-1 px-1.5 py-1 sm:gap-2 sm:px-2.5 sm:py-1.5">
      {/* Il gruppo dei set resta della sua larghezza: così la parte punteggio
          (con l'errore generico) sta tutta su una riga anche sui tablet. */}
      <div className="flex w-full min-w-0 flex-nowrap items-center gap-1 sm:w-auto sm:gap-1.5">
        <span className="mr-0.5 hidden text-[10px] font-semibold uppercase tracking-wider text-ink-mute sm:inline">
          Set
        </span>
        {scout.sets.map((set) => {
          const attivo = set.n === setAttivo.n;
          const conElimina = scout.sets.length > 1;
          return (
            <div
              key={set.n}
              className={`min-w-0 flex h-8 flex-1 items-center overflow-hidden rounded-xl border transition-colors duration-150 sm:flex-none sm:h-9 ${
                attivo
                  ? 'border-accent bg-accent text-on-accent shadow-lg shadow-accent/25'
                  : 'border-line-strong bg-panel-2 text-ink-soft hover:text-ink'
              }`}
            >
              <button
                type="button"
                aria-label={`Set ${set.n}`}
                aria-pressed={attivo}
                onClick={() => onSelezionaSet(set.n)}
                className={`flex h-full min-w-0 flex-1 cursor-pointer items-center justify-center gap-0.5 text-[10px] sm:flex-none sm:gap-1 sm:text-xs ${
                  conElimina ? 'pl-1.5 pr-0.5 sm:pl-2.5 sm:pr-1' : 'px-1.5 sm:px-2.5'
                }`}
              >
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">
                  {set.n}
                </span>
                <span className="font-semibold tabular-nums">
                  {set.nostro}-{set.loro}
                </span>
              </button>
              {conElimina && (
                <button
                  type="button"
                  aria-label={`Elimina set ${set.n}`}
                  title={`Elimina il set ${set.n}`}
                  onClick={() => onEliminaSet(set.n)}
                  className={`flex h-full w-5 cursor-pointer items-center justify-center transition-opacity sm:w-6 ${
                    attivo ? 'hover:opacity-80' : 'opacity-55 hover:opacity-100'
                  }`}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          );
        })}
        <IconButton
          label="Aggiungi set"
          onClick={onAggiungiSet}
          disabled={!piuSet}
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          <Plus size={15} />
        </IconButton>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1 sm:gap-1.5">
        {squadre.map(({ campo, label, aria }) => (
          <div
            key={campo}
            className="flex items-center gap-0 rounded-xl border border-line bg-panel-2 p-0.5 sm:gap-0.5 sm:p-1"
          >
            <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-ink-mute">
              {label}
            </span>
            <button
              type="button"
              aria-label={`Togli punto a ${label}`}
              onClick={() => onDeltaPunteggio(setAttivo.n, campo, -1)}
              className={BTN_PUNTO}
            >
              −
            </button>
            <input
              type="number"
              min={0}
              max={999}
              inputMode="numeric"
              aria-label={`Punteggio ${aria}`}
              className="h-7 w-8 min-w-0 rounded-lg border-0 bg-transparent text-center text-sm font-bold text-ink outline-none transition-colors [appearance:textfield] focus:bg-panel focus:ring-2 focus:ring-accent/30 sm:h-9 sm:w-11 sm:text-base [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              value={setAttivo[campo]}
              onChange={(e) =>
                onCambiaPunteggio(setAttivo.n, campo, clampPunteggio(e.target.value))
              }
            />
            <button
              type="button"
              aria-label={`Aggiungi punto a ${label}`}
              onClick={() => onDeltaPunteggio(setAttivo.n, campo, 1)}
              className={BTN_PUNTO}
            >
              +
            </button>
          </div>
        ))}
        <button
          type="button"
          aria-label="Errore generico"
          title="Dà un punto all'avversario e registra un errore generico, senza toccare le statistiche dei giocatori"
          onClick={onErroreGenerico}
          className="flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-ko/45 bg-ko/10 px-1.5 text-[10px] font-semibold text-ko transition-colors duration-150 hover:bg-ko/15 sm:h-9 sm:gap-1.5 sm:px-2.5 sm:text-xs"
        >
          Errore generico
          <span className="text-[10px] font-medium opacity-70">+1 Loro</span>
        </button>
      </div>
    </Card>
  );
}
