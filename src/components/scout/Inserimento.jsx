import { X } from 'lucide-react';
import { useToast } from '../Toast.jsx';
import { Button, Card } from '../ui.jsx';
import { AZIONI, ESITI, ESITO_CLASSI, isLibero, ordinaNumeri } from '../../lib/scout-stats.js';

const LABEL_AZIONE = Object.fromEntries(AZIONI.map((azione) => [azione.id, azione.label]));
const LABEL_ESITO = Object.fromEntries(ESITI.map((esito) => [esito.id, esito.label]));

const BTN_GIOCATORE =
  'flex h-11 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border text-sm transition-colors duration-150 sm:h-14 sm:gap-1 sm:text-base';
const GIOCATORE_OFF = 'border-line-strong bg-panel-2 text-ink hover:border-ink-faint';
/** Tonalità leggermente diversa: i liberi si riconoscono a colpo d'occhio. */
const GIOCATORE_LIBERO = 'border-info/45 bg-info/10 text-ink hover:border-info/70';
const GIOCATORE_ON = 'border-accent bg-accent text-on-accent shadow-lg shadow-accent/25';
/** Card in panchina: sempre toccabile, ma evidenziata quando c'è chi sostituire. */
const GIOCATORE_PANCHINA = 'border-line-strong bg-panel-2 text-ink-soft hover:border-ink-faint';
const GIOCATORE_PANCHINA_ON = 'border-dashed border-accent/60 bg-panel-2 text-ink';

const BTN_AZIONE =
  'h-11 cursor-pointer rounded-xl border px-1 text-xs font-semibold transition-colors duration-150 sm:h-14 sm:px-2 sm:text-sm';
const AZIONE_OFF =
  'border-line-strong bg-panel-2 text-ink-soft hover:border-ink-faint hover:text-ink';
const AZIONE_ON = 'border-accent bg-accent text-on-accent shadow-lg shadow-accent/25';

const BTN_ESITO =
  'flex h-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border border-transparent transition-colors duration-150 sm:h-16 sm:gap-1';
const ESITO_OFF = 'ring-1';

/**
 * Pannello di inserimento rapido: giocatore → azione → esito.
 * Il dato viene registrato al tocco sull'esito e salvato subito.
 *
 * Sostituzioni senza trascinamento: toccando un giocatore in campo lo si
 * seleziona; da lì si può registrargli il dato (azione + esito) oppure toccare
 * un giocatore in panchina per farlo entrare al suo posto.
 */
export default function Inserimento({
  scout,
  giocatori,
  numeroSel,
  setNumeroSel,
  azioneSel,
  setAzioneSel,
  onRegistra,
  onCambiaInCampo,
  onAnnullaUltimo,
  onRimuoviAzione,
  onRimuoviGenerico,
}) {
  const toast = useToast();

  const osservaRosa = scout.squadraOsservata === 'propria' && giocatori.length > 0;
  const convocati =
    Array.isArray(scout.convocati) && scout.convocati.length > 0 ? new Set(scout.convocati) : null;
  const base = osservaRosa
    ? giocatori
        .filter((giocatore) => !convocati || convocati.has(giocatore.numeroMaglia))
        .map((giocatore) => giocatore.numeroMaglia)
    : Array.from({ length: 20 }, (_, index) => index + 1);
  // L'ordine personalizzato dal riepilogo vale anche qui.
  const numeri = ordinaNumeri([...new Set(base)], scout.ordineGiocatori);
  const cognomi = new Map(
    giocatori.map((giocatore) => [giocatore.numeroMaglia, giocatore.cognome || giocatore.nome]),
  );
  const liberi = new Set(giocatori.filter(isLibero).map((giocatore) => giocatore.numeroMaglia));
  const numeriDisponibili = new Set(numeri);
  const movimento = numeri.filter((numero) => !liberi.has(numero));
  const defaultInCampo = [
    ...movimento.slice(0, 6),
    ...numeri.filter((numero) => liberi.has(numero)).slice(0, 1),
  ];
  const configuratiInCampo = [
    ...new Set((scout.inCampo ?? defaultInCampo).filter((numero) => numeriDisponibili.has(numero))),
  ];
  const inCampo = osservaRosa
    ? [
        ...configuratiInCampo.filter((numero) => !liberi.has(numero)).slice(0, 6),
        ...configuratiInCampo.filter((numero) => liberi.has(numero)).slice(0, 1),
      ]
    : numeri;
  const numeriInCampo = new Set(inCampo);

  /** Il libero non compie battuta né muro (solo se osserviamo la nostra rosa). */
  const azioneNonValida = (numero, azione) =>
    numero !== null &&
    osservaRosa &&
    liberi.has(numero) &&
    (azione === 'battuta' || azione === 'muro');

  /** Imposta la selezione, azzerando l'azione se non è valida per il giocatore. */
  const impostaSelezione = (numero) => {
    setNumeroSel(numero);
    if (azioneNonValida(numero, azioneSel)) setAzioneSel(null);
  };

  /** Tocco su un giocatore in campo: seleziona (o deseleziona se già scelto). */
  const selezionaGiocatore = (numero) => {
    impostaSelezione(numeroSel === numero ? null : numero);
  };

  /**
   * Tocco su un giocatore in panchina: fa entrare lui al posto del giocatore
   * in campo selezionato (che va in panchina). Senza selezione, avvisa.
   */
  const sostituisci = (entrato) => {
    if (numeroSel === null) {
      toast.show('Tocca prima un giocatore in campo, poi chi lo sostituisce.', 'error');
      return;
    }
    if (entrato === numeroSel) return;
    const prossimo = inCampo.map((numero) => (numero === numeroSel ? entrato : numero));
    const movimentoInCampo = prossimo.filter((numero) => !liberi.has(numero)).length;
    const liberiInCampo = prossimo.filter((numero) => liberi.has(numero)).length;
    if (movimentoInCampo > 6 || liberiInCampo > 1) {
      toast.show('In campo puoi avere 6 giocatori e 1 libero.', 'error');
      return;
    }
    onCambiaInCampo(prossimo);
    // Il neo-entrato resta selezionato: si può registrargli subito il dato.
    impostaSelezione(entrato);
  };

  const registra = (esito) => {
    if (numeroSel === null) {
      toast.show('Seleziona prima il giocatore.', 'error');
      return;
    }
    if (!azioneSel) {
      toast.show("Seleziona prima l'azione.", 'error');
      return;
    }
    if (azioneNonValida(numeroSel, azioneSel)) {
      toast.show('Il libero non compie battuta né muro.', 'error');
      return;
    }
    onRegistra(numeroSel, azioneSel, esito);
    // Il giocatore resta selezionato: si registra al tocco l'esito successivo.
    setAzioneSel(null);
  };

  // Cronologia mista: azioni ed errori generici, dal più recente al più vecchio.
  const eventi = [
    ...scout.azioni.map((azione) => ({ ...azione, tipo: 'azione' })),
    ...(scout.generici ?? []).map((generico) => ({ ...generico, tipo: 'generico' })),
  ].sort((a, b) => a.ts - b.ts);
  const ultimi = eventi.slice(-6).reverse();
  const ultimo = eventi[eventi.length - 1] ?? null;

  return (
    // Da md (tablet) la colonna laterale affianca l'inserimento: su iPad
    // tutta la scrimata sta in un'unica schermata, senza scroll.
    <div className="flex flex-col gap-4">
      <Card className="w-full p-2 sm:p-4">
        {/* Giocatore */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Giocatore</h2>
          <p className="text-xs text-ink-mute">
            {numeroSel !== null ? `Selezionato: ${numeroSel}` : 'Tocca un numero in campo'}
          </p>
        </div>
        {osservaRosa ? (
          <div className="mt-2 grid gap-2 sm:mt-3 sm:gap-4 lg:grid-cols-2">
            {[
              ['In campo', numeri.filter((numero) => numeriInCampo.has(numero)), true],
              ['Panchina', numeri.filter((numero) => !numeriInCampo.has(numero)), false],
            ].map(([titolo, elenco, attivo]) => (
              <div
                key={titolo}
                className={`rounded-xl border p-2 sm:p-3 ${
                  !attivo && numeroSel !== null
                    ? 'border-dashed border-accent/55 bg-panel-2'
                    : 'border-line bg-panel-2'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
                    {titolo}
                  </h3>
                  <span className="text-xs text-ink-faint">
                    {elenco.length}/{attivo ? '6 + 1 L' : numeri.length}
                  </span>
                </div>
                <div className="mt-1.5 grid grid-cols-4 gap-1.5 sm:mt-2 sm:grid-cols-4 sm:gap-2 xl:grid-cols-6">
                  {elenco.map((numero) => {
                    const attivoSelezionato = attivo && numeroSel === numero;
                    const cognome = cognomi.get(numero);
                    const libero = liberi.has(numero);
                    return (
                      <button
                        key={numero}
                        type="button"
                        aria-label={`Giocatore ${numero}${attivo ? '' : ' in panchina'}`}
                        aria-pressed={attivo ? attivoSelezionato : undefined}
                        title={
                          attivo
                            ? undefined
                            : 'Tocca per far entrare questo giocatore al posto di quello selezionato'
                        }
                        onClick={() => (attivo ? selezionaGiocatore(numero) : sostituisci(numero))}
                        className={`${BTN_GIOCATORE} ${
                          attivoSelezionato
                            ? GIOCATORE_ON
                            : attivo
                              ? libero
                                ? GIOCATORE_LIBERO
                                : GIOCATORE_OFF
                              : numeroSel !== null
                                ? GIOCATORE_PANCHINA_ON
                                : GIOCATORE_PANCHINA
                        }`}
                      >
                        <span className="text-base font-bold leading-none sm:text-lg">
                          {numero}
                          {libero && (
                            <span
                              className={`ml-1 align-super text-[8px] font-extrabold sm:text-[9px] ${
                                attivoSelezionato ? 'text-white/75' : 'text-info'
                              }`}
                            >
                              L
                            </span>
                          )}
                        </span>
                        {cognome && (
                          <span className="w-full truncate px-1 text-[9px] leading-none opacity-80 sm:text-[10px]">
                            {cognome}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-4 gap-1.5 sm:mt-3 sm:grid-cols-6 sm:gap-2 md:grid-cols-7 lg:grid-cols-8 2xl:grid-cols-10">
            {numeri.map((numero) => {
              const attivo = numeroSel === numero;
              const cognome = osservaRosa ? cognomi.get(numero) : null;
              const libero = osservaRosa && liberi.has(numero);
              return (
                <button
                  key={numero}
                  type="button"
                  aria-label={`Giocatore ${numero}`}
                  aria-pressed={attivo}
                  onClick={() => selezionaGiocatore(numero)}
                  className={`${BTN_GIOCATORE} ${
                    attivo ? GIOCATORE_ON : libero ? GIOCATORE_LIBERO : GIOCATORE_OFF
                  }`}
                >
                  <span className="text-base font-bold leading-none sm:text-lg">
                    {numero}
                    {libero && (
                      <span
                        className={`ml-1 align-super text-[8px] font-extrabold sm:text-[9px] ${
                          attivo ? 'text-white/75' : 'text-info'
                        }`}
                      >
                        L
                      </span>
                    )}
                  </span>
                  {cognome && (
                    <span className="w-full truncate px-1 text-[9px] leading-none opacity-80 sm:text-[10px]">
                      {cognome}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {osservaRosa && (
          <p className="mt-2 text-[10px] text-ink-mute sm:mt-3 sm:text-xs">
            {numeroSel !== null
              ? `N. ${numeroSel}: scegli azione ed esito per registrare il dato, oppure tocca un giocatore in panchina per sostituirlo.`
              : 'Tocca un giocatore in campo: potrai registrargli il dato o sostituirlo con uno in panchina.'}
          </p>
        )}
        {!osservaRosa && <p className="mt-2 text-xs text-ink-mute sm:mt-3">Numeri da 1 a 20.</p>}

        {/* Azione */}
        <div className="mt-2 border-t border-line pt-2 sm:mt-3 sm:pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">Azione</h2>
            <p className="text-xs text-ink-mute">Quale gesto tecnico ha compiuto</p>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5 sm:mt-3 sm:grid-cols-4 sm:gap-2">
            {AZIONI.map((azione) => {
              const attivo = azioneSel === azione.id;
              const disabilitata = azioneNonValida(numeroSel, azione.id);
              return (
                <button
                  key={azione.id}
                  type="button"
                  aria-pressed={attivo}
                  disabled={disabilitata}
                  title={disabilitata ? 'Il libero non compie battuta né muro' : undefined}
                  onClick={() => setAzioneSel(attivo ? null : azione.id)}
                  className={`${BTN_AZIONE} ${attivo ? AZIONE_ON : AZIONE_OFF} ${
                    disabilitata ? 'cursor-not-allowed opacity-40' : ''
                  }`}
                >
                  {azione.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Esito */}
        <div className="mt-2 border-t border-line pt-2 sm:mt-3 sm:pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">Esito</h2>
            <p className="text-xs text-ink-mute">
              Un tocco e il dato viene salvato · # +1 Noi, = +1 Loro
            </p>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5 sm:mt-3 sm:gap-2">
            {ESITI.map((esito) => (
              <button
                key={esito.id}
                type="button"
                aria-label={`Esito ${esito.breve}`}
                onClick={() => registra(esito.id)}
                className={`${BTN_ESITO} ${
                  azioneSel && numeroSel !== null
                    ? ESITO_CLASSI[esito.id].attivo
                    : `${ESITO_CLASSI[esito.id].tondo} ${ESITO_OFF}`
                }`}
              >
                <span className="text-2xl font-black leading-none">{esito.id}</span>
                <span className="text-[11px] font-semibold leading-none">{esito.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Dati inseriti, sempre dopo le pulsantiere e a tutta larghezza */}
      <div className="grid w-full gap-4 lg:grid-cols-2">
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-xs text-ink-soft">
            {ultimo ? (
              ultimo.tipo === 'generico' ? (
                <>
                  Ultimo: <span className="font-semibold text-ink">Errore generico</span> · set{' '}
                  {ultimo.set}
                </>
              ) : (
                <>
                  Ultimo: <span className="font-semibold text-ink">N. {ultimo.numero}</span> ·{' '}
                  {LABEL_AZIONE[ultimo.azione]} · {LABEL_ESITO[ultimo.esito]}
                </>
              )
            ) : (
              'Nessun dato inserito per ora.'
            )}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onAnnullaUltimo}
            disabled={eventi.length === 0}
          >
            Annulla ultimo
          </Button>
        </Card>

        <Card className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
            Ultimi inserimenti
          </h3>
          {ultimi.length === 0 ? (
            <p className="mt-2 text-sm text-ink-faint">Ancora nessun dato.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {ultimi.map((evento) =>
                evento.tipo === 'generico' ? (
                  <li
                    key={evento.id}
                    className="flex items-center gap-2 rounded-xl border border-line bg-panel-2 px-3 py-2"
                  >
                    <span className="w-10 shrink-0 text-xs font-extrabold text-ko">ERR</span>
                    <span className="truncate text-sm text-ink-soft">
                      Errore generico · set {evento.set}
                    </span>
                    <button
                      type="button"
                      aria-label="Rimuovi errore generico"
                      onClick={() => onRimuoviGenerico(evento.id)}
                      className="ml-auto flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-mute transition-colors hover:bg-panel hover:text-accent-text"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ) : (
                  <li
                    key={evento.id}
                    className="flex items-center gap-2 rounded-xl border border-line bg-panel-2 px-3 py-2"
                  >
                    <span className="w-10 shrink-0 text-sm font-bold text-ink">
                      N. {evento.numero}
                    </span>
                    <span className="truncate text-sm text-ink-soft">
                      {LABEL_AZIONE[evento.azione]}
                    </span>
                    <span
                      className={`ml-auto inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-lg px-1.5 text-xs font-bold ${ESITO_CLASSI[evento.esito].tondo}`}
                    >
                      {evento.esito}
                    </span>
                    <button
                      type="button"
                      aria-label={`Rimuovi azione N. ${evento.numero}`}
                      onClick={() => onRimuoviAzione(evento.id)}
                      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-mute transition-colors hover:bg-panel hover:text-accent-text"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ),
              )}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
