import { useEffect, useRef, useState } from 'react';
import { Check, UsersRound } from 'lucide-react';
import { Button, Modal } from '../ui.jsx';
import {
  IN_CAMPO_LIBERI,
  IN_CAMPO_MOVIMENTO,
  TITOLARI,
  componiFormazione,
  isLibero,
} from '../../lib/scout-stats.js';

const CHIP =
  'flex h-12 cursor-pointer items-center gap-2.5 rounded-xl border px-3 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40';
const CHIP_OFF = 'border-line-strong bg-panel-2 text-ink hover:border-ink-faint';
const CHIP_LIBERO = 'border-info/45 bg-info/10 text-ink hover:border-info/70';
const CHIP_ON = 'border-accent bg-accent text-on-accent shadow-lg shadow-accent/25';

/**
 * Scelta dei 7 titolari (6 di movimento + 1 libero) all'inizio di un set.
 * I titolari vengono mostrati in cima alla tabella del riepilogo; il libero
 * resta sempre in fondo.
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
  const [scelti, setScelti] = useState([]);
  const inizialeRef = useRef(iniziale);
  inizialeRef.current = iniziale;

  // Ogni apertura riparte dalla formazione proposta (quella del set o la
  // predefinita calcolata dal chiamante).
  useEffect(() => {
    if (open) setScelti([...new Set(inizialeRef.current)].filter(Boolean));
  }, [open, numeroSet]);

  const scelto = (numero) => scelti.includes(numero);
  const nMovimento = scelti.filter((numero) => {
    const giocatore = disponibili.find((voce) => voce.numeroMaglia === numero);
    return !isLibero(giocatore);
  }).length;
  const nLiberi = scelti.filter((numero) => {
    const giocatore = disponibili.find((voce) => voce.numeroMaglia === numero);
    return isLibero(giocatore);
  }).length;

  const toggle = (giocatore) => {
    const numero = giocatore.numeroMaglia;
    if (scelto(numero)) {
      setScelti((correnti) => correnti.filter((n) => n !== numero));
      return;
    }
    if (isLibero(giocatore) ? nLiberi >= IN_CAMPO_LIBERI : nMovimento >= IN_CAMPO_MOVIMENTO) {
      return;
    }
    setScelti((correnti) => [...correnti, numero]);
  };

  const conferma = () => {
    // Il libero va in fondo; la formazione viene comunque limitata a 7.
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
        Scegli chi inizia il set: <b className="text-ink">6 di movimento + 1 libero</b> (massimo{' '}
        {TITOLARI}). Il libero resta in fondo alla tabella.
      </p>

      {disponibili.length === 0 ? (
        <p className="mt-4 text-sm text-ink-mute">
          Non ci sono giocatori convocati: aggiungili dalla pagina Rosa.
        </p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-mute">
            <span>
              Selezionati:{' '}
              <b className="text-ink">
                {scelti.length}/{Math.min(TITOLARI, disponibili.length)}
              </b>
            </span>
            <span>
              Di movimento:{' '}
              <b className="text-ink">
                {nMovimento}/{IN_CAMPO_MOVIMENTO}
              </b>
            </span>
            <span>
              Liberi:{' '}
              <b className="text-ink">
                {nLiberi}/{IN_CAMPO_LIBERI}
              </b>
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {disponibili.map((giocatore) => {
              const attivo = scelto(giocatore.numeroMaglia);
              const libero = isLibero(giocatore);
              const pieno = libero
                ? nLiberi >= IN_CAMPO_LIBERI
                : nMovimento >= IN_CAMPO_MOVIMENTO;
              return (
                <button
                  key={giocatore.numeroMaglia}
                  type="button"
                  aria-label={`Titolare ${giocatore.nome} ${giocatore.cognome}`}
                  aria-pressed={attivo}
                  disabled={!attivo && pieno}
                  title={!attivo && pieno ? 'Posti esauriti per questo reparto' : undefined}
                  onClick={() => toggle(giocatore)}
                  className={`${CHIP} ${
                    attivo ? CHIP_ON : libero ? CHIP_LIBERO : CHIP_OFF
                  }`}
                >
                  <span className="w-7 shrink-0 text-center text-sm font-bold tabular-nums">
                    {giocatore.numeroMaglia}
                    {libero && (
                      <span
                        className={`ml-0.5 align-super text-[9px] font-extrabold ${
                          attivo ? 'text-white/75' : 'text-info'
                        }`}
                      >
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
        </>
      )}
    </Modal>
  );
}
