import { X } from 'lucide-react';
import { useToast } from '../Toast.jsx';
import { Button, Card } from '../ui.jsx';
import { AZIONI, ESITI, ESITO_CLASSI, isLibero } from '../../lib/scout-stats.js';

const LABEL_AZIONE = Object.fromEntries(AZIONI.map((azione) => [azione.id, azione.label]));
const LABEL_ESITO = Object.fromEntries(ESITI.map((esito) => [esito.id, esito.label]));

const BTN_GIOCATORE =
  'flex h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border transition-colors duration-150';
const GIOCATORE_OFF = 'border-line-strong bg-panel-2 text-ink hover:border-ink-faint';
/** Tonalità leggermente diversa: i liberi si riconoscono a colpo d'occhio. */
const GIOCATORE_LIBERO = 'border-info/45 bg-info/10 text-ink hover:border-info/70';
const GIOCATORE_ON = 'border-accent bg-accent text-on-accent shadow-lg shadow-accent/25';

const BTN_AZIONE =
  'h-14 cursor-pointer rounded-xl border text-sm font-semibold transition-colors duration-150';
const AZIONE_OFF =
  'border-line-strong bg-panel-2 text-ink-soft hover:border-ink-faint hover:text-ink';
const AZIONE_ON = 'border-accent bg-accent text-on-accent shadow-lg shadow-accent/25';

const BTN_ESITO =
  'flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-transparent transition-colors duration-150';
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
  /** Il libero non compie battuta né muro (solo se osserviamo la nostra rosa). */
  const azioneNonValida = (numero, azione) =>
    numero !== null &&
    osservaRosa &&
    liberi.has(numero) &&
    (azione === 'battuta' || azione === 'muro');
  const liberoSel = numeroSel !== null && osservaRosa && liberi.has(numeroSel);

  const selezionaGiocatore = (numero) => {
    const prossimo = numeroSel === numero ? null : numero;
    setNumeroSel(prossimo);
    // Un'azione non valida per il libero viene azzerata.
    if (azioneNonValida(prossimo, azioneSel)) setAzioneSel(null);
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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
      <Card className="p-4 sm:p-5">
        {/* Giocatore */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Giocatore</h2>
          <p className="text-xs text-ink-mute">
            {numeroSel !== null ? `Selezionato: ${numeroSel}` : 'Tocca un numero'}
          </p>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8 2xl:grid-cols-10">
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
                <span className="text-lg font-bold leading-none">
                  {numero}
                  {libero && (
                    <span
                      className={`ml-1 align-super text-[9px] font-extrabold ${
                        attivo ? 'text-white/75' : 'text-info'
                      }`}
                    >
                      L
                    </span>
                  )}
                </span>
                {cognome && (
                  <span className="w-full truncate px-1 text-[10px] leading-none opacity-80">
                    {cognome}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {!osservaRosa && <p className="mt-3 text-xs text-ink-mute">Numeri da 1 a 20.</p>}

        {/* Azione */}
        <div className="mt-5 border-t border-line pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">Azione</h2>
            <p className="text-xs text-ink-mute">Quale gesto tecnico ha compiuto</p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:max-w-[760px]">
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
        <div className="mt-5 border-t border-line pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">Esito</h2>
            <p className="text-xs text-ink-mute">
              Un tocco e il dato viene salvato · # +1 Noi, = +1 Loro
            </p>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 lg:max-w-[760px]">
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

      {/* Colonna laterale: ultimo dato e ultimi inserimenti */}
      <div className="flex flex-col gap-4">
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
                    className="flex items-center gap-3 rounded-xl border border-line bg-panel-2 px-3 py-2"
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
                    className="flex items-center gap-3 rounded-xl border border-line bg-panel-2 px-3 py-2"
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
