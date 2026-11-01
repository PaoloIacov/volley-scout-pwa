import { useEffect, useRef, useState } from 'react';
import { Check, UsersRound } from 'lucide-react';
import { Button, Modal } from '../ui.jsx';
import {
  TITOLARI_MOVIMENTO,
  componiFormazione,
  isLibero,
} from '../../lib/scout-stats.js';

const CHIP =
  'flex h-12 cursor-pointer items-center gap-2.5 rounded-xl border px-3 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40';
const CHIP_OFF = 'border-line-strong bg-panel-2 text-ink hover:border-ink-faint';
const CHIP_ON = 'border-accent bg-accent text-on-accent shadow-lg shadow-accent/25';

/**
 * Scelta dei titolari all'inizio di un set. Si scelgono solo i 6 giocatori di
 * movimento: i liberi (fino a due, per il doppio libero) entrano sempre in
 * campo e vengono aggiunti automaticamente in fondo alla formazione.
 *
 * @param {boolean} open
 * @param {number} numeroSet set a cui si riferisce la formazione
 * @param {Array} giocatori rosa disponibile
 * @param {number[]} convocati numeri convocati (tutta la rosa se assente)
 * @param {number[]} iniziale formazione proposta
 * @param {(numeri:number[])=>void} onConfirm
 * @param {()=>void} onCancel
 */
export default function FormazioneModal({
  open,
  numeroSet,
  giocatori = [],
  convocati,
  iniziale = [],
  onConfirm,
  onCancel,
}) {
  const disponibili = giocatori.filter(
    (giocatore) =>
      !Array.isArray(convocati) ||
      convocati.length === 0 ||
      convocati.includes(giocatore.numeroMaglia),
  );
  // I liberi non si scelgono: la modale riguarda solo i giocatori di movimento.
  const movimento = disponibili.filter((giocatore) => !isLibero(giocatore));
  const [scelti, setScelti] = useState([]);
  const inizialeRef = useRef(iniziale);
  inizialeRef.current = iniziale;

  // Ogni apertura riparte dalla formazione proposta (quella del set o la
  // predefinita calcolata dal chiamante), ignorando gli eventuali liberi.
  useEffect(() => {
    if (!open) return;
    const ammessi = new Set(movimento.map((giocatore) => giocatore.numeroMaglia));
    setScelti([...new Set(inizialeRef.current)].filter((numero) => ammessi.has(numero)));
  }, [open, numeroSet]);

  const scelto = (numero) => scelti.includes(numero);

  const toggle = (giocatore) => {
    const numero = giocatore.numeroMaglia;
    if (scelto(numero)) {
      setScelti((correnti) => correnti.filter((n) => n !== numero));
      return;
    }
    if (scelti.length >= TITOLARI_MOVIMENTO) return;
    setScelti((correnti) => [...correnti, numero]);
  };

  const conferma = () => {
    onConfirm?.(componiFormazione(scelti, disponibili));
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={`Titolari del set ${numeroSet ?? ''}`.trim()}
      icon={UsersRound}
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            Annulla
          </Button>
          <Button variant="primary" onClick={conferma} disabled={scelti.length === 0}>
            <Check size={16} />
            Conferma titolari
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-soft">
        Scegli i <b className="text-ink">{TITOLARI_MOVIMENTO} giocatori di movimento</b> che
        iniziano il set. I liberi (fino a due) entrano automaticamente e restano in fondo alla
        tabella.
      </p>

      {movimento.length === 0 ? (
        <p className="mt-4 text-sm text-ink-mute">
          {disponibili.length === 0
            ? 'Non ci sono giocatori convocati: aggiungili dalla pagina Rosa.'
            : 'Non ci sono giocatori di movimento convocati: i liberi entrano automaticamente.'}
        </p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-mute">
            <span>
              Selezionati:{' '}
              <b className="text-ink">
                {scelti.length}/{Math.min(TITOLARI_MOVIMENTO, movimento.length)}
              </b>
            </span>
            <span>Liberi: automatici (fino a 2)</span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {movimento.map((giocatore) => {
              const attivo = scelto(giocatore.numeroMaglia);
              const pieno = !attivo && scelti.length >= TITOLARI_MOVIMENTO;
              return (
                <button
                  key={giocatore.numeroMaglia}
                  type="button"
                  aria-label={`Titolare ${giocatore.nome} ${giocatore.cognome}`}
                  aria-pressed={attivo}
                  disabled={pieno}
                  title={pieno ? 'Hai già scelto tutti i giocatori di movimento' : undefined}
                  onClick={() => toggle(giocatore)}
                  className={`${CHIP} ${attivo ? CHIP_ON : CHIP_OFF}`}
                >
                  <span className="w-7 shrink-0 text-center text-sm font-bold tabular-nums">
                    {giocatore.numeroMaglia}
                  </span>
                  <span className="min-w-0 truncate text-sm">
                    {giocatore.nome} {giocatore.cognome}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Modal>
  );
}
