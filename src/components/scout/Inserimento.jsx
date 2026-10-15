import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useToast } from '../Toast.jsx';
import { Button, Card } from '../ui.jsx';
import { AZIONI, ESITI, ESITO_CLASSI } from '../../lib/scout-stats.js';

const LABEL_AZIONE = Object.fromEntries(AZIONI.map((azione) => [azione.id, azione.label]));
const LABEL_ESITO = Object.fromEntries(ESITI.map((esito) => [esito.id, esito.label]));

const BTN_GIOCATORE =
  'flex h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border transition-colors duration-150';
const GIOCATORE_OFF = 'border-line-strong bg-panel-2 text-ink hover:border-ink-faint';
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
  onAggiungiNumero,
}) {
  const toast = useToast();
  const [numeroLibero, setNumeroLibero] = useState('');

  const osservaRosa = scout.squadraOsservata === 'propria' && giocatori.length > 0;
  const base = osservaRosa
    ? giocatori.map((giocatore) => giocatore.numeroMaglia)
    : Array.from({ length: 20 }, (_, index) => index + 1);
  const numeri = [...new Set([...base, ...scout.numeriExtra])].sort((a, b) => a - b);
  const cognomi = new Map(
    giocatori.map((giocatore) => [giocatore.numeroMaglia, giocatore.cognome || giocatore.nome]),
  );

  const registra = (esito) => {
    if (numeroSel === null) {
      toast.show('Seleziona prima il giocatore.', 'error');
      return;
    }
    if (!azioneSel) {
      toast.show("Seleziona prima l'azione.", 'error');
      return;
    }
    onRegistra(numeroSel, azioneSel, esito);
    // Il giocatore resta selezionato: si registra al tocco l'esito successivo.
    setAzioneSel(null);
  };

  const aggiungiNumero = () => {
    const numero = Number.parseInt(numeroLibero, 10);
    if (Number.isNaN(numero) || numero < 1 || numero > 99) {
      toast.show('Inserisci un numero tra 1 e 99.', 'error');
      return;
    }
    onAggiungiNumero(numero);
    setNumeroLibero('');
    setNumeroSel(numero);
  };

  const ultimi = [...scout.azioni].slice(-6).reverse();
  const ultimo = scout.azioni[scout.azioni.length - 1];

  return (
    <Card className="p-4 sm:p-5">
      {/* Giocatore */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Giocatore</h2>
        <p className="text-xs text-ink-mute">
          {numeroSel !== null ? `Selezionato: ${numeroSel}` : 'Tocca un numero'}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
        {numeri.map((numero) => {
          const attivo = numeroSel === numero;
          const cognome = osservaRosa ? cognomi.get(numero) : null;
          return (
            <button
              key={numero}
              type="button"
              aria-label={`Giocatore ${numero}`}
              aria-pressed={attivo}
              onClick={() => setNumeroSel(attivo ? null : numero)}
              className={`${BTN_GIOCATORE} ${attivo ? GIOCATORE_ON : GIOCATORE_OFF}`}
            >
              <span className="text-lg font-bold leading-none">{numero}</span>
              {cognome && (
                <span className="w-full truncate px-1 text-[10px] leading-none opacity-80">
                  {cognome}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={99}
          inputMode="numeric"
          placeholder="N. extra"
          aria-label="Altro numero"
          className="h-11 w-28 rounded-xl border border-line-strong bg-panel-2 px-3 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          value={numeroLibero}
          onChange={(e) => setNumeroLibero(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              aggiungiNumero();
            }
          }}
        />
        <Button variant="outline" size="sm" onClick={aggiungiNumero}>
          <Plus size={14} />
          Aggiungi numero
        </Button>
        {!osservaRosa && (
          <span className="text-xs text-ink-mute">Numeri da 1 a 20, oppure aggiungine uno.</span>
        )}
      </div>

      {/* Azione */}
      <div className="mt-5 border-t border-line pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Azione</h2>
          <p className="text-xs text-ink-mute">Quale gesto tecnico ha compiuto</p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {AZIONI.map((azione) => {
            const attivo = azioneSel === azione.id;
            return (
              <button
                key={azione.id}
                type="button"
                aria-pressed={attivo}
                onClick={() => setAzioneSel(attivo ? null : azione.id)}
                className={`${BTN_AZIONE} ${attivo ? AZIONE_ON : AZIONE_OFF}`}
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
          <p className="text-xs text-ink-mute">Un tocco e il dato viene salvato</p>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
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

      {/* Ultimo dato + annulla */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-panel-2 px-3 py-2.5">
        <p className="text-xs text-ink-soft">
          {ultimo ? (
            <>
              Ultimo: <span className="font-semibold text-ink">N. {ultimo.numero}</span> ·{' '}
              {LABEL_AZIONE[ultimo.azione]} · {LABEL_ESITO[ultimo.esito]}
            </>
          ) : (
            'Nessun dato inserito per ora.'
          )}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onAnnullaUltimo}
          disabled={scout.azioni.length === 0}
        >
          Annulla ultimo
        </Button>
      </div>

      {/* Ultimi inserimenti */}
      <div className="mt-5 border-t border-line pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
          Ultimi inserimenti
        </h3>
        {ultimi.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faint">Ancora nessun dato.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {ultimi.map((azione) => (
              <li
                key={azione.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-panel-2 px-3 py-2"
              >
                <span className="w-10 shrink-0 text-sm font-bold text-ink">N. {azione.numero}</span>
                <span className="truncate text-sm text-ink-soft">
                  {LABEL_AZIONE[azione.azione]}
                </span>
                <span
                  className={`ml-auto inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-lg px-1.5 text-xs font-bold ${ESITO_CLASSI[azione.esito].tondo}`}
                >
                  {azione.esito}
                </span>
                <button
                  type="button"
                  aria-label={`Rimuovi azione N. ${azione.numero}`}
                  onClick={() => onRimuoviAzione(azione.id)}
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-mute transition-colors hover:bg-panel hover:text-accent-text"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
