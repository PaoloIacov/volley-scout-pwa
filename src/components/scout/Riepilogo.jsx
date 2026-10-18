import { useEffect, useRef, useState } from 'react';
import { ClipboardList, GripVertical } from 'lucide-react';
import { Card } from '../ui.jsx';
import {
  AZIONI,
  ESITI,
  ESITO_CLASSI,
  costruisciRiepilogo,
  contaGenerici,
  genericiPerSet,
  isLibero,
} from '../../lib/scout-stats.js';

/** Gruppi di colonna: le azioni più il totale, ognuno con le 4 sotto-colonne esito. */
const GRUPPI = [...AZIONI, { id: 'tot', label: 'Tot' }];

/**
 * Numero in una sotto-colonna: badge colorato con il conteggio per esito
 * (punto quando non c'è nulla). `primo` disegna il bordo verticale che separa
 * i gruppi di colonna. Con `onClic` la cella diventa un pulsante che registra
 * il dato (giocatore × azione × esito) direttamente dal riepilogo.
 */
function Numero({ valore, esito, primo, onClic, etichetta, disabilitato }) {
  const bordo = primo ? 'border-l border-line ' : '';
  const contenuto = valore ? (
    <span
      className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-xs font-bold tabular-nums ring-1 ${ESITO_CLASSI[esito].tondo}`}
    >
      {valore}
    </span>
  ) : (
    <span className="text-base leading-none text-ink-faint">·</span>
  );

  if (onClic) {
    return (
      <td className={`${bordo}p-1 text-center align-middle`}>
        <button
          type="button"
          aria-label={etichetta}
          title={etichetta}
          disabled={disabilitato}
          onClick={onClic}
          className={`flex h-9 w-full min-w-9 items-center justify-center rounded-lg transition-colors duration-150 ${
            disabilitato
              ? 'cursor-not-allowed opacity-40'
              : 'cursor-pointer hover:bg-panel-2 active:bg-accent/10 active:scale-95'
          }`}
        >
          {contenuto}
        </button>
      </td>
    );
  }

  return (
    <td className={`${bordo}p-1 text-center align-middle`}>
      <span className="flex h-9 min-w-9 items-center justify-center">{contenuto}</span>
    </td>
  );
}

/**
 * Riepilogo parziale: tabella giocatore × azione con ogni colonna (compreso il
 * Tot) suddivisa nelle 4 sotto-colonne di esito, più la riga con i totali della
 * squadra. È anche un secondo pannello di scout: toccando una cella di azione si
 * registra quel dato per il giocatore, e trascinando la maniglia si cambia
 * l'ordine dei giocatori (salvato nello scout).
 */
export default function Riepilogo({ scout, giocatori, onRegistra, onOrdina }) {
  const { righe, totali, totaliPerEsito } = costruisciRiepilogo(scout, giocatori);
  const totaleGenerale = AZIONI.reduce((somma, azione) => somma + totali[azione.id].tot, 0);
  const generici = genericiPerSet(scout);
  const totGenerici = contaGenerici(scout);

  /** I liberi non compiono battuta né muro: anche qui quei dati restano bloccati. */
  const liberi =
    scout.squadraOsservata === 'propria'
      ? new Set(giocatori.filter(isLibero).map((giocatore) => giocatore.numeroMaglia))
      : new Set();

  // --- Riordino con trascinamento (maniglia di riga) -------------------------
  const ordineBase = righe.map((riga) => riga.numero);
  const ordineBaseRef = useRef(ordineBase);
  ordineBaseRef.current = ordineBase;
  const onOrdinaRef = useRef(onOrdina);
  onOrdinaRef.current = onOrdina;
  const [trascinato, setTrascinato] = useState(null);
  const [anteprima, setAnteprima] = useState(null);
  const anteprimaRef = useRef(null);

  useEffect(() => {
    if (trascinato === null) return undefined;

    const muovi = (event) => {
      const sotto = document.elementFromPoint?.(event.clientX, event.clientY);
      const riga = sotto?.closest?.('[data-riga]');
      if (!riga) return;
      const destinazione = Number(riga.dataset.riga);
      const corrente = anteprimaRef.current ?? ordineBaseRef.current;
      const da = corrente.indexOf(trascinato);
      const a = corrente.indexOf(destinazione);
      if (da < 0 || a < 0 || da === a) return;
      const prossimo = [...corrente];
      prossimo.splice(da, 1);
      prossimo.splice(a, 0, trascinato);
      anteprimaRef.current = prossimo;
      setAnteprima(prossimo);
    };

    const fine = () => {
      const corrente = anteprimaRef.current;
      if (corrente && corrente.join('|') !== ordineBaseRef.current.join('|')) {
        onOrdinaRef.current?.(corrente);
      }
      anteprimaRef.current = null;
      setAnteprima(null);
      setTrascinato(null);
    };

    document.addEventListener('pointermove', muovi);
    document.addEventListener('pointerup', fine);
    document.addEventListener('pointercancel', fine);
    return () => {
      document.removeEventListener('pointermove', muovi);
      document.removeEventListener('pointerup', fine);
      document.removeEventListener('pointercancel', fine);
    };
  }, [trascinato]);

  const iniziaTrascinamento = (numero) => (event) => {
    event.preventDefault();
    anteprimaRef.current = null;
    setAnteprima(null);
    setTrascinato(numero);
  };

  const ordineMostrato = anteprima ?? ordineBase;
  const perNumero = new Map(righe.map((riga) => [riga.numero, riga]));
  const righeMostrate = ordineMostrato.map((numero) => perNumero.get(numero)).filter(Boolean);

  if (righe.length === 0 && totGenerici === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-panel-2 text-ink-soft ring-1 ring-line">
          <ClipboardList size={26} />
        </div>
        <p className="font-medium text-ink">Nessun dato rilevato</p>
        <p className="max-w-sm text-sm text-ink-mute">
          Passa alla tab Inserimento, oppure torna qui: toccando una cella registri il dato
          direttamente.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="bg-panel-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
              <th scope="col" rowSpan={2} className="px-4 py-3 text-left align-bottom">
                Giocatore
              </th>
              {GRUPPI.map((gruppo) => (
                <th
                  key={gruppo.id}
                  scope="colgroup"
                  colSpan={ESITI.length}
                  className="border-l border-line px-2 pt-3 pb-1.5 text-center"
                >
                  {gruppo.label}
                </th>
              ))}
            </tr>
            <tr className="border-b border-line bg-panel-2 text-ink-mute">
              {GRUPPI.map((gruppo) =>
                ESITI.map((esito, i) => (
                  <th
                    key={`${gruppo.id}-${esito.id}`}
                    scope="col"
                    className={`pb-2.5 text-center ${i === 0 ? 'border-l border-line' : ''}`}
                  >
                    <span
                      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-[11px] font-bold ${ESITO_CLASSI[esito.id].tondo}`}
                    >
                      {esito.id}
                    </span>
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {righeMostrate.map((riga) => {
              const inMovimento = riga.numero === trascinato;
              return (
                <tr
                  key={riga.numero}
                  data-riga={riga.numero}
                  className={`transition-colors ${inMovimento ? 'bg-accent/10 opacity-70' : ''}`}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {righe.length > 1 && (
                        <button
                          type="button"
                          aria-label={`Trascina per ordinare N. ${riga.numero}`}
                          title="Trascina per cambiare l'ordine dei giocatori"
                          onPointerDown={iniziaTrascinamento(riga.numero)}
                          className="flex h-9 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-panel-2 hover:text-ink active:cursor-grabbing"
                        >
                          <GripVertical size={15} />
                        </button>
                      )}
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-panel-2 text-sm font-bold text-ink ring-1 ring-line-strong tabular-nums">
                        {riga.numero}
                      </span>
                      {riga.nome && (
                        <span className="min-w-0 truncate text-sm text-ink">{riga.nome}</span>
                      )}
                    </div>
                  </td>
                  {AZIONI.map((azione) =>
                    ESITI.map((esito, i) => {
                      const disabilitato =
                        liberi.has(riga.numero) &&
                        (azione.id === 'battuta' || azione.id === 'muro');
                      return (
                        <Numero
                          key={`${azione.id}-${esito.id}`}
                          valore={riga.celle[azione.id][esito.id]}
                          esito={esito.id}
                          primo={i === 0}
                          disabilitato={disabilitato}
                          etichetta={`Registra ${azione.label} ${esito.breve} per N. ${riga.numero}`}
                          onClic={
                            onRegistra
                              ? () => onRegistra(riga.numero, azione.id, esito.id)
                              : undefined
                          }
                        />
                      );
                    }),
                  )}
                  {ESITI.map((esito, i) => (
                    <Numero
                      key={`tot-${esito.id}`}
                      valore={riga.perEsito[esito.id]}
                      esito={esito.id}
                      primo={i === 0}
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-line bg-panel-2">
              <td className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">
                Totale
                <span className="block text-[10px] font-normal normal-case tracking-normal text-ink-mute">
                  {totaleGenerale} azioni
                </span>
              </td>
              {AZIONI.map((azione) =>
                ESITI.map((esito, i) => (
                  <Numero
                    key={`${azione.id}-${esito.id}`}
                    valore={totali[azione.id][esito.id]}
                    esito={esito.id}
                    primo={i === 0}
                  />
                )),
              )}
              {ESITI.map((esito, i) => (
                <Numero
                  key={`tot-${esito.id}`}
                  valore={totaliPerEsito[esito.id]}
                  esito={esito.id}
                  primo={i === 0}
                />
              ))}
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
              className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold ring-1 ${ESITO_CLASSI[esito.id].tondo}`}
            >
              {esito.id}
            </span>
            {esito.breve}
          </span>
        ))}
        <span className="inline-flex items-center gap-1 sm:ml-auto">
          Tocca una cella per registrare · trascina
          <GripVertical size={13} aria-hidden="true" />
          per ordinare i giocatori
        </span>
      </div>
    </Card>
  );
}
