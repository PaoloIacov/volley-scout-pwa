import { useEffect, useState } from 'react';
import { Check, UsersRound } from 'lucide-react';
import { Button, Modal } from '../ui.jsx';
import { MAX_LIBERI, MAX_MOVIMENTO, MAX_CONVOCATI, isLibero } from '../../lib/scout-stats.js';

const CHIP =
  'flex h-12 cursor-pointer items-center gap-2.5 rounded-xl border px-3 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45';
const CHIP_OFF = 'border-line-strong bg-panel-2 text-ink hover:border-ink-faint';
const CHIP_LIBERO = 'border-info/45 bg-info/10 text-ink hover:border-info/70';
const CHIP_ON = 'border-accent bg-accent text-on-accent shadow-lg shadow-accent/25';

export default function ConvocatiModal({
  open,
  tipo = 'campionato',
  giocatori = [],
  convocati,
  onCancel,
  onConfirm,
}) {
  const [scelti, setScelti] = useState([]);
  const amichevole = tipo === 'amichevole';
  const tuttiConvocati = !Array.isArray(convocati) || convocati.length === 0;

  useEffect(() => {
    if (!open) return;
    setScelti(
      giocatori
        .filter((giocatore) => tuttiConvocati || convocati.includes(giocatore.numeroMaglia))
        .map((giocatore) => giocatore.numeroMaglia),
    );
  }, [open]);

  const convocato = (numero) => scelti.includes(numero);
  const nMovimento = giocatori.filter(
    (giocatore) => !isLibero(giocatore) && convocato(giocatore.numeroMaglia),
  ).length;
  const nLiberi = giocatori.filter(
    (giocatore) => isLibero(giocatore) && convocato(giocatore.numeroMaglia),
  ).length;

  const toggle = (giocatore) => {
    const numero = giocatore.numeroMaglia;
    if (convocato(numero)) {
      setScelti((correnti) => correnti.filter((n) => n !== numero));
      return;
    }
    if (
      !amichevole &&
      (isLibero(giocatore) ? nLiberi >= MAX_LIBERI : nMovimento >= MAX_MOVIMENTO)
    ) {
      return;
    }
    setScelti((correnti) => [...correnti, numero]);
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Modifica convocati"
      icon={UsersRound}
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            Annulla
          </Button>
          <Button variant="primary" onClick={() => onConfirm?.([...scelti].sort((a, b) => a - b))}>
            <Check size={16} />
            Salva convocati
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-soft">
        Aggiorna i convocati anche dopo aver iniziato lo scout. Le azioni già registrate non
        vengono modificate.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-mute">
        {amichevole ? (
          <span>
            Convocati: <b className="text-ink">{scelti.length}/{giocatori.length}</b> · nessun limite
          </span>
        ) : (
          <>
            <span>
              Di movimento: <b className="text-ink">{nMovimento}/{MAX_MOVIMENTO}</b>
            </span>
            <span>
              Liberi: <b className="text-ink">{nLiberi}/{MAX_LIBERI}</b>
            </span>
            <span>Massimo {MAX_CONVOCATI}</span>
          </>
        )}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {giocatori.map((giocatore) => {
          const attivo = convocato(giocatore.numeroMaglia);
          const libero = isLibero(giocatore);
          const pieno = libero ? nLiberi >= MAX_LIBERI : nMovimento >= MAX_MOVIMENTO;
          return (
            <button
              key={giocatore.numeroMaglia}
              type="button"
              aria-label={`Convoca ${giocatore.nome} ${giocatore.cognome}`}
              aria-pressed={attivo}
              disabled={!amichevole && !attivo && pieno}
              title={!amichevole && pieno && !attivo ? 'Limite convocati raggiunto' : undefined}
              onClick={() => toggle(giocatore)}
              className={`${CHIP} ${attivo ? CHIP_ON : libero ? CHIP_LIBERO : CHIP_OFF}`}
            >
              <span className="w-7 shrink-0 text-center text-sm font-bold tabular-nums">
                {giocatore.numeroMaglia}
                {libero && (
                  <span className={`ml-0.5 align-super text-[9px] font-extrabold ${
                    attivo ? 'text-white/75' : 'text-info'
                  }`}>
                    L
                  </span>
                )}
              </span>
              <span className="min-w-0 truncate text-sm">
                {giocatore.nome} {giocatore.cognome}
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
