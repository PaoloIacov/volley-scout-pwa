import { useState } from 'react';
import { ArrowLeftRight, ClipboardList, UsersRound } from 'lucide-react';
import { Button, Card, Modal } from '../ui.jsx';
import {
  AZIONI,
  ESITI,
  ESITO_CLASSI,
  IN_CAMPO_LIBERI,
  IN_CAMPO_MOVIMENTO,
  costruisciRiepilogo,
  contaErroriAvversari,
  contaGenerici,
  erroriAvversariPerSet,
  genericiPerSet,
  numeriLiberi,
} from '../../lib/scout-stats.js';

/** Gruppi di colonna: solo le azioni (il Tot resta negli export Excel/PDF). */
const GRUPPI = AZIONI;

/**
 * Numero in una sotto-colonna: badge colorato con il conteggio per esito
 * (punto quando non c'è nulla). `primo` disegna il bordo verticale che separa
 * i gruppi di colonna. Con `onClic` la cella diventa un pulsante che registra
 * il dato (giocatore × azione × esito) direttamente dal riepilogo.
 */
function Numero({ valore, esito, primo, onClic, etichetta, disabilitato }) {
  const bordo = primo ? 'border-l-2 border-line-strong ' : '';
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
      <td className={`${bordo}border-t border-line-strong/60 p-1 text-center align-middle`}>
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
    <td className={`${bordo}border-t border-line-strong/60 p-1 text-center align-middle`}>
      <span className="flex h-9 min-w-9 items-center justify-center">{contenuto}</span>
    </td>
  );
}

/**
 * Riepilogo parziale: tabella giocatore × azione con ogni colonna suddivisa
 * nelle 4 sotto-colonne di esito. È anche un secondo pannello di scout:
 * toccando una cella di azione si registra quel dato per il giocatore.
 *
 * Dalla stagione corrente la tabella mostra solo i 7 titolari scelti per il
 * set attivo: al posto della vecchia maniglia di trascinamento c'è il pulsante
 * di sostituzione, che fa entrare un giocatore dalla panchina. Il Tot resta
 * negli export Excel/PDF.
 */
export default function Riepilogo({
  scout,
  giocatori,
  formazione,
  onRegistra,
  onSostituisci,
  onScegliFormazione,
}) {
  const { righe, totali } = costruisciRiepilogo(scout, giocatori);
  const totaleGenerale = AZIONI.reduce((somma, azione) => somma + totali[azione.id].tot, 0);
  const generici = genericiPerSet(scout);
  const totGenerici = contaGenerici(scout);
  const erroriAvversari = erroriAvversariPerSet(scout);
  const totAvversari = contaErroriAvversari(scout);
  const puntiNoi = scout.sets.reduce((somma, set) => somma + (Number(set.nostro) || 0), 0);
  const quotaAvversari =
    puntiNoi > 0 ? Math.min(100, Math.round((totAvversari / puntiNoi) * 100)) : 0;

  const propria = scout.squadraOsservata === 'propria';
  const inFormazione = propria && Array.isArray(formazione) && formazione.length > 0;
  const liberi = numeriLiberi(giocatori);
  const perNumero = new Map(righe.map((riga) => [riga.numero, riga]));
  const righeVisibili = inFormazione
    ? formazione.map((numero) => perNumero.get(numero)).filter(Boolean)
    : righe;

  // Panchina: convocati che non sono in campo nel set attivo.
  const convocati =
    Array.isArray(scout.convocati) && scout.convocati.length > 0
      ? new Set(scout.convocati)
      : null;
  const numeriRosa = giocatori
    .filter((giocatore) => !convocati || convocati.has(giocatore.numeroMaglia))
    .map((giocatore) => giocatore.numeroMaglia);
  const panchina = inFormazione
    ? numeriRosa.filter((numero) => !formazione.includes(numero))
    : [];

  /** La sostituzione deve lasciare in campo al massimo 6 + 1 libero. */
  const sostituzioneValida = (uscita, entrata) => {
    if (!inFormazione) return false;
    const prossima = formazione.map((numero) => (numero === uscita ? entrata : numero));
    return (
      prossima.filter((numero) => !liberi.has(numero)).length <= IN_CAMPO_MOVIMENTO &&
      prossima.filter((numero) => liberi.has(numero)).length <= IN_CAMPO_LIBERI
    );
  };

  const [uscita, setUscita] = useState(null);
  const rigaUscita = uscita !== null ? perNumero.get(uscita) : null;
  const puoSostituire = Boolean(inFormazione && onSostituisci && panchina.length > 0);

  const sostituisci = (entrata) => {
    if (uscita === null) return;
    onSostituisci?.(uscita, entrata);
    setUscita(null);
  };

  if (righe.length === 0 && totGenerici === 0 && totAvversari === 0) {
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
    <>
      <Card className="overflow-hidden p-0">
        {inFormazione && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-panel-2 px-3 py-2 text-xs text-ink-soft">
            <span>
              <span className="font-semibold uppercase tracking-wider text-ink">Titolari</span>{' '}
              del set {scout.setCorrente}: {formazione.length}/7 · tocca
              <ArrowLeftRight size={12} className="mx-1 inline" aria-hidden="true" />
              per sostituire
            </span>
            {onScegliFormazione && (
              <Button variant="outline" size="sm" onClick={onScegliFormazione}>
                <UsersRound size={14} />
                Cambia titolari
              </Button>
            )}
          </div>
        )}

        <div className="max-h-[calc(100dvh-13rem)] overflow-auto">
          <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-panel-2 text-[11px] font-semibold uppercase tracking-wider">
                <th
                  scope="col"
                  rowSpan={2}
                  className="border-b border-line-strong bg-panel-2 px-4 py-3 text-left align-bottom text-ink"
                >
                  Giocatore
                </th>
                {GRUPPI.map((gruppo) => (
                  <th
                    key={gruppo.id}
                    scope="colgroup"
                    colSpan={ESITI.length}
                    className="border-b border-l-2 border-line-strong bg-panel-2 px-2 pb-1.5 pt-3 text-center font-bold text-ink"
                  >
                    {gruppo.label}
                  </th>
                ))}
              </tr>
              <tr className="bg-panel-2 text-ink-soft">
                {GRUPPI.map((gruppo) =>
                  ESITI.map((esito, i) => (
                    <th
                      key={`${gruppo.id}-${esito.id}`}
                      scope="col"
                      className={`border-b border-line-strong bg-panel-2 pb-2.5 text-center ${
                        i === 0 ? 'border-l-2 border-line-strong' : ''
                      }`}
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
            <tbody>
              {righeVisibili.map((riga) => (
                <tr
                  key={riga.numero}
                  className="transition-colors even:bg-panel-2/65 hover:bg-accent/5"
                >
                  <td className="border-t border-line-strong/70 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-panel-2 text-sm font-bold text-ink ring-1 ring-line-strong tabular-nums">
                        {riga.numero}
                      </span>
                      {riga.nome && (
                        <span className="min-w-0 truncate text-sm font-medium text-ink">
                          {riga.nome}
                        </span>
                      )}
                      {propria && liberi.has(riga.numero) && (
                        <span className="shrink-0 rounded-md bg-info/10 px-1.5 py-0.5 text-[10px] font-bold text-info ring-1 ring-info/30">
                          L
                        </span>
                      )}
                      {puoSostituire && (
                        <button
                          type="button"
                          aria-label={`Sostituisci N. ${riga.numero}`}
                          title={`Sostituisci N. ${riga.numero} con un giocatore in panchina`}
                          onClick={() => setUscita(riga.numero)}
                          className="ml-auto flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-mute transition-colors hover:bg-panel-2 hover:text-accent-text"
                        >
                          <ArrowLeftRight size={15} />
                        </button>
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
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-panel-2">
                <td className="border-t-2 border-line-strong px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink">
                  Totale squadra
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
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="border-t border-line px-4 py-3 text-xs">
          <p>
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
          <p className="mt-1">
            <span className="font-semibold uppercase tracking-wider text-ink-mute">
              Punti da errori avversari:
            </span>{' '}
            <span className="font-bold text-ok tabular-nums">{totAvversari}</span>
            {erroriAvversari.map((voce) => (
              <span key={voce.set} className="text-ink-mute">
                {' · set '}
                {voce.set}: {voce.n}
              </span>
            ))}
            {totAvversari > 0 && puntiNoi > 0 && (
              <span className="text-ink-mute">
                {' · '}
                {quotaAvversari}% dei nostri punti ({totAvversari}/{puntiNoi})
              </span>
            )}
          </p>
        </div>

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
            Tocca una cella per registrare
            {inFormazione && (
              <>
                {' · '}
                <ArrowLeftRight size={13} aria-hidden="true" />
                per sostituire
              </>
            )}
          </span>
        </div>

        {inFormazione && (
          <p className="border-t border-line bg-panel-2 px-4 py-2 text-[11px] text-ink-mute">
            La tabella mostra i 7 titolari del set {scout.setCorrente}. I dati degli altri
            giocatori restano nei totali di squadra e nell&apos;export Excel/PDF.
          </p>
        )}
      </Card>

      <Modal
        open={uscita !== null}
        onClose={() => setUscita(null)}
        title={rigaUscita ? `Sostituisci N. ${rigaUscita.numero}` : 'Sostituzione'}
        icon={ArrowLeftRight}
        footer={
          <Button variant="outline" onClick={() => setUscita(null)}>
            Chiudi
          </Button>
        }
      >
        <p className="mb-3 text-sm text-ink-soft">
          Scegli chi entra al posto di{' '}
          <span className="font-semibold text-ink">
            {rigaUscita?.nome ? `${rigaUscita.nome} (N. ${rigaUscita.numero})` : `N. ${uscita}`}
          </span>
          . Restano in campo 6 giocatori e 1 libero.
        </p>
        {panchina.length === 0 ? (
          <p className="text-sm text-ink-mute">Non ci sono giocatori in panchina.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {panchina.map((numero) => {
              const valida = sostituzioneValida(uscita, numero);
              const nome = perNumero.get(numero)?.nome ?? '';
              const libero = liberi.has(numero);
              return (
                <button
                  key={numero}
                  type="button"
                  disabled={!valida}
                  aria-label={`Fai entrare N. ${numero}`}
                  title={
                    valida
                      ? `Fai entrare N. ${numero}`
                      : 'La sostituzione non rispetta il vincolo 6 + 1 libero'
                  }
                  onClick={() => sostituisci(numero)}
                  className={`flex h-12 cursor-pointer items-center gap-2 rounded-xl border px-3 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
                    libero
                      ? 'border-info/45 bg-info/10 text-ink hover:border-info/70'
                      : 'border-line-strong bg-panel-2 text-ink hover:border-ink-faint'
                  }`}
                >
                  <span className="w-7 shrink-0 text-center text-sm font-bold tabular-nums">
                    {numero}
                    {libero && (
                      <span className="ml-0.5 align-super text-[9px] font-extrabold text-info">
                        L
                      </span>
                    )}
                  </span>
                  {nome && <span className="min-w-0 truncate text-sm">{nome}</span>}
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </>
  );
}
