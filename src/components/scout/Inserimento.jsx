import { ArrowLeftRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '../Toast.jsx';
import { Button, Card } from '../ui.jsx';
import { AZIONI, ESITI, ESITO_CLASSI, isLibero } from '../../lib/scout-stats.js';

const LABEL_AZIONE = Object.fromEntries(AZIONI.map((azione) => [azione.id, azione.label]));
const LABEL_ESITO = Object.fromEntries(ESITI.map((esito) => [esito.id, esito.label]));

const BTN_GIOCATORE =
  'flex h-11 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border text-sm transition-colors duration-150 sm:h-14 sm:gap-1 sm:text-base';
const GIOCATORE_OFF = 'border-line-strong bg-panel-2 text-ink hover:border-ink-faint';
/** Tonalità leggermente diversa: i liberi si riconoscono a colpo d'occhio. */
const GIOCATORE_LIBERO = 'border-info/45 bg-info/10 text-ink hover:border-info/70';
const GIOCATORE_ON = 'border-accent bg-accent text-on-accent shadow-lg shadow-accent/25';
const GIOCATORE_PANCHINA = 'cursor-not-allowed border-line bg-panel text-ink-faint opacity-55';

/** Distanza in px oltre la quale un tocco diventa un trascinamento. */
const SOGLIA_TRASCINAMENTO = 6;

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
  const numeri = [...new Set(base)].sort((a, b) => a - b);
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
  const [numeroTrascinato, setNumeroTrascinato] = useState(null);
  const [posizioneTrascinamento, setPosizioneTrascinamento] = useState(null);
  const trascinatoRef = useRef(false);
  const origineTrascinamentoRef = useRef(null);
  /** Ultima posizione nota del puntatore: serve a trovare la zona al rilascio. */
  const posizioneRiferimentoRef = useRef(null);
  /**
   * Toggle "Sostituzioni": finché è spento i giocatori restano al loro posto,
   * così il tocco serve solo a selezionarli e non si confonde col trascinamento.
   */
  const [sostituzioni, setSostituzioni] = useState(false);

  useEffect(() => {
    if (numeroTrascinato === null) return undefined;

    const aggiornaPosizione = (event) => {
      posizioneRiferimentoRef.current = { x: event.clientX, y: event.clientY };
      setPosizioneTrascinamento({ x: event.clientX, y: event.clientY });
    };
    const rilasciaGiocatore = (event) => {
      // Su touch il browser cattura implicitamente il puntatore sulla card
      // d'origine: event.target resta sempre quella card, mai l'elemento sotto
      // il dito. La zona di drop va quindi cercata col puntamento geometrico.
      const punto = posizioneRiferimentoRef.current;
      const sottoIlDito = punto ? document.elementFromPoint?.(punto.x, punto.y) : null;
      const area =
        sottoIlDito?.closest?.('[data-drop-zone]') ?? event.target?.closest?.('[data-drop-zone]');
      if (area) {
        spostaGiocatore(numeroTrascinato, area.dataset.dropZone === 'campo');
      }
      setNumeroTrascinato(null);
      setPosizioneTrascinamento(null);
      posizioneRiferimentoRef.current = null;
      origineTrascinamentoRef.current = null;
    };

    document.addEventListener('pointermove', aggiornaPosizione);
    document.addEventListener('pointerup', rilasciaGiocatore);
    document.addEventListener('pointercancel', rilasciaGiocatore);
    return () => {
      document.removeEventListener('pointermove', aggiornaPosizione);
      document.removeEventListener('pointerup', rilasciaGiocatore);
      document.removeEventListener('pointercancel', rilasciaGiocatore);
    };
  }, [numeroTrascinato]);
  /** Il libero non compie battuta né muro (solo se osserviamo la nostra rosa). */
  const azioneNonValida = (numero, azione) =>
    numero !== null &&
    osservaRosa &&
    liberi.has(numero) &&
    (azione === 'battuta' || azione === 'muro');
  const liberoSel = numeroSel !== null && osservaRosa && liberi.has(numeroSel);

  const selezionaGiocatore = (numero) => {
    if (osservaRosa && !numeriInCampo.has(numero)) return;
    const prossimo = numeroSel === numero ? null : numero;
    setNumeroSel(prossimo);
    // Un'azione non valida per il libero viene azzerata.
    if (azioneNonValida(prossimo, azioneSel)) setAzioneSel(null);
  };

  const spostaGiocatore = (numero, destinazione) => {
    if (!osservaRosa || numero === null) return;
    const giaInCampo = numeriInCampo.has(numero);
    if (giaInCampo === destinazione) return;
    const prossimo = destinazione
      ? [...inCampo, numero]
      : inCampo.filter((voce) => voce !== numero);
    const movimentoInCampo = prossimo.filter((voce) => !liberi.has(voce)).length;
    const liberiInCampo = prossimo.filter((voce) => liberi.has(voce)).length;
    if (movimentoInCampo > 6 || liberiInCampo > 1) {
      toast.show('In campo puoi avere 6 giocatori e 1 libero.', 'error');
      return;
    }
    onCambiaInCampo(prossimo);
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
          <div className="flex items-center gap-2 sm:gap-3">
            <p className="text-xs text-ink-mute">
              {numeroSel !== null ? `Selezionato: ${numeroSel}` : 'Tocca un numero'}
            </p>
            {osservaRosa && (
              <button
                type="button"
                role="switch"
                aria-checked={sostituzioni}
                title={
                  sostituzioni
                    ? 'Spostamenti tra campo e panchina attivi: clicca per bloccarli'
                    : 'Clicca per spostare i giocatori tra campo e panchina'
                }
                onClick={() => setSostituzioni((attivo) => !attivo)}
                className={`inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition-colors duration-150 ${
                  sostituzioni
                    ? 'border-accent bg-accent text-on-accent shadow-md shadow-accent/25'
                    : 'border-line-strong bg-panel-2 text-ink-soft hover:border-ink-faint hover:text-ink'
                }`}
              >
                <ArrowLeftRight size={13} aria-hidden="true" />
                Sostituzioni
              </button>
            )}
          </div>
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
                  sostituzioni
                    ? 'border-dashed border-accent/55 bg-panel-2'
                    : 'border-line bg-panel-2'
                }`}
                data-drop-zone={attivo ? 'campo' : 'panchina'}
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
                    const attivoSelezionato = numeroSel === numero;
                    const cognome = cognomi.get(numero);
                    const libero = liberi.has(numero);
                    return (
                      <button
                        key={numero}
                        type="button"
                        aria-label={`Giocatore ${numero}${attivo ? '' : ' in panchina'}`}
                        aria-pressed={attivoSelezionato}
                        aria-disabled={!attivo}
                        onPointerDown={(event) => {
                          trascinatoRef.current = false;
                          origineTrascinamentoRef.current = null;
                          // Il trascinamento esiste solo con il toggle "Sostituzioni" attivo.
                          if (!sostituzioni) return;
                          origineTrascinamentoRef.current = { x: event.clientX, y: event.clientY };
                        }}
                        onPointerMove={(event) => {
                          const origine = origineTrascinamentoRef.current;
                          if (!sostituzioni || !origine) return;
                          if (
                            Math.hypot(event.clientX - origine.x, event.clientY - origine.y) <
                            SOGLIA_TRASCINAMENTO
                          ) {
                            return;
                          }
                          origineTrascinamentoRef.current = null;
                          trascinatoRef.current = true;
                          setNumeroTrascinato(numero);
                          posizioneRiferimentoRef.current = { x: event.clientX, y: event.clientY };
                          setPosizioneTrascinamento({ x: event.clientX, y: event.clientY });
                        }}
                        onClick={() => {
                          if (trascinatoRef.current) {
                            trascinatoRef.current = false;
                            return;
                          }
                          if (attivo) selezionaGiocatore(numero);
                        }}
                        className={`${BTN_GIOCATORE} ${sostituzioni ? 'touch-none' : ''} ${
                          attivoSelezionato
                            ? GIOCATORE_ON
                            : attivo
                              ? libero
                                ? GIOCATORE_LIBERO
                                : GIOCATORE_OFF
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
            {sostituzioni
              ? 'Trascina le card tra campo e panchina. I giocatori in panchina sono disabilitati.'
              : 'Attiva Sostituzioni per trascinare le card tra campo e panchina. I giocatori in panchina sono disabilitati.'}
          </p>
        )}
        {!osservaRosa && <p className="mt-2 text-xs text-ink-mute sm:mt-3">Numeri da 1 a 20.</p>}

        {/* Azione */}
        <div className="mt-2 border-t border-line pt-2 sm:mt-3 sm:pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">Azione</h2>
            <p className="text-xs text-ink-mute">Quale gesto tecnico ha compiuto</p>
          </div>
          <div className="mt-2 grid grid-cols-5 gap-1.5 sm:mt-3 sm:grid-cols-5 sm:gap-2">
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

      {numeroTrascinato !== null && posizioneTrascinamento && (
        <div
          className={`pointer-events-none fixed z-50 flex h-14 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-xl border shadow-2xl ${
            liberi.has(numeroTrascinato)
              ? 'border-info/70 bg-info text-white'
              : 'border-accent bg-accent text-on-accent'
          }`}
          style={{
            left: posizioneTrascinamento.x,
            top: posizioneTrascinamento.y,
          }}
          aria-hidden="true"
        >
          <span className="text-lg font-bold leading-none">
            {numeroTrascinato}
            {liberi.has(numeroTrascinato) && (
              <span className="ml-1 align-super text-[9px] font-extrabold text-white/75">L</span>
            )}
          </span>
          {cognomi.get(numeroTrascinato) && (
            <span className="w-full truncate px-1 text-center text-[10px] leading-none opacity-90">
              {cognomi.get(numeroTrascinato)}
            </span>
          )}
        </div>
      )}

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
