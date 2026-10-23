import { useState } from 'react';
import { ClipboardList, Play } from 'lucide-react';
import { useForm } from '../hooks/useForm.js';
import { Button, Field, Modal, SegmentedControl, inputClass } from '../components/ui.jsx';
import { MAX_LIBERI, MAX_MOVIMENTO, MAX_CONVOCATI, isLibero } from '../lib/scout-stats.js';
import { todayISO } from '../lib/dates.js';

const CHIP_CONVOCATO =
  'flex h-12 cursor-pointer items-center gap-2.5 rounded-xl border px-3 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45';
const CHIP_OFF = 'border-line-strong bg-panel-2 text-ink hover:border-ink-faint';
const CHIP_LIBERO = 'border-info/45 bg-info/10 text-ink hover:border-info/70';
const CHIP_ON = 'border-accent bg-accent text-on-accent shadow-lg shadow-accent/25';

const TIPI_PARTITA = [
  { value: 'campionato', label: 'Campionato' },
  { value: 'amichevole', label: 'Amichevole' },
];

function toFormValues(prefill) {
  return {
    data: prefill?.data || todayISO(),
    orarioInizio: prefill?.orarioInizio ?? '',
    avversario: prefill?.avversario ?? '',
    luogo: prefill?.luogo ?? '',
    tipo: prefill?.tipo === 'amichevole' ? 'amichevole' : 'campionato',
    squadraOsservata: 'propria',
  };
}

/**
 * Preselezione dei convocati: in campionato i primi 12 di movimento e i primi
 * 2 liberi; in amichevole tutta la rosa (nessun limite).
 */
function preselezione(giocatori, tipo = 'campionato') {
  if (tipo === 'amichevole') {
    return giocatori.map((giocatore) => giocatore.numeroMaglia).sort((a, b) => a - b);
  }
  const movimento = giocatori.filter((giocatore) => !isLibero(giocatore)).slice(0, MAX_MOVIMENTO);
  const liberi = giocatori.filter(isLibero).slice(0, MAX_LIBERI);
  return [...movimento, ...liberi].map((giocatore) => giocatore.numeroMaglia).sort((a, b) => a - b);
}

function validate(values) {
  const errors = {};
  if (!values.data) errors.data = 'La data è obbligatoria';

  if (!values.avversario.trim()) errors.avversario = "L'avversario è obbligatorio";
  else if (values.avversario.trim().length < 2)
    errors.avversario = "L'avversario deve avere almeno 2 caratteri";

  return errors;
}

/**
 * Form di creazione di un nuovo scout. `prefill` (dal calendario) precompila
 * i dati della gara; `squadra` dà il nome con cui scegliere quale delle due
 * squadre scoutizzare; `giocatori` serve a comporre i convocati.
 */
export default function ScoutForm({ open, prefill, squadra, giocatori = [], onCancel, onSave }) {
  const form = useForm(toFormValues(prefill), validate);
  const [convocati, setConvocati] = useState(() => preselezione(giocatori, prefill?.tipo));

  const osservaPropria = form.values.squadraOsservata === 'propria';
  const amichevole = form.values.tipo === 'amichevole';
  const convocato = (numero) => convocati.includes(numero);
  const nMovimento = giocatori.filter(
    (giocatore) => !isLibero(giocatore) && convocato(giocatore.numeroMaglia),
  ).length;
  const nLiberi = giocatori.filter(
    (giocatore) => isLibero(giocatore) && convocato(giocatore.numeroMaglia),
  ).length;

  const toggleConvocato = (giocatore) => {
    const numero = giocatore.numeroMaglia;
    if (convocato(numero)) {
      setConvocati((correnti) => correnti.filter((n) => n !== numero));
      return;
    }
    // In amichevole non c'è limite: si possono convocare tutti.
    if (amichevole) {
      setConvocati((correnti) => [...correnti, numero]);
      return;
    }
    const pieno = isLibero(giocatore) ? nLiberi >= MAX_LIBERI : nMovimento >= MAX_MOVIMENTO;
    if (pieno) return;
    setConvocati((correnti) => [...correnti, numero]);
  };

  /** Cambiando tipo si riallineano i convocati ai limiti previsti. */
  const cambiaTipo = (tipo) => {
    form.setField('tipo', tipo);
    setConvocati(preselezione(giocatori, tipo));
  };

  const onSubmit = form.handleSubmit((values) => {
    onSave({
      data: values.data,
      orarioInizio: values.orarioInizio.trim(),
      avversario: values.avversario.trim(),
      luogo: values.luogo.trim(),
      tipo: values.tipo,
      squadraOsservata: values.squadraOsservata,
      // Convocati solo per la propria rosa (e solo se ce ne sono).
      ...(values.squadraOsservata === 'propria' && convocati.length > 0
        ? { convocati: [...convocati].sort((a, b) => a - b) }
        : {}),
    });
  });

  const onBlur = (field) => () => form.touch(field);

  const opzioniSquadra = [
    { value: 'propria', label: squadra?.nome || 'La mia squadra' },
    { value: 'avversaria', label: form.values.avversario.trim() || 'Avversaria' },
  ];

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Nuovo scout"
      icon={ClipboardList}
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            Annulla
          </Button>
          <Button variant="primary" onClick={onSubmit} disabled={!form.isValid}>
            <Play size={16} />
            Inizia lo scout
          </Button>
        </>
      }
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <Field label="Data *" htmlFor="data" error={form.showError('data') && form.errors.data}>
          <input
            id="data"
            type="date"
            className={inputClass(form.showError('data'))}
            value={form.values.data}
            onChange={(e) => form.setField('data', e.target.value)}
            onBlur={onBlur('data')}
          />
        </Field>

        <Field label="Orario" htmlFor="orarioInizio">
          <input
            id="orarioInizio"
            type="time"
            className={inputClass(false)}
            value={form.values.orarioInizio}
            onChange={(e) => form.setField('orarioInizio', e.target.value)}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field
            label="Avversario *"
            htmlFor="avversario"
            error={form.showError('avversario') && form.errors.avversario}
          >
            <input
              id="avversario"
              type="text"
              placeholder="Nome squadra avversaria"
              className={inputClass(form.showError('avversario'))}
              value={form.values.avversario}
              onChange={(e) => form.setField('avversario', e.target.value)}
              onBlur={onBlur('avversario')}
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Luogo" htmlFor="luogo">
            <input
              id="luogo"
              type="text"
              placeholder="Campo di gioco"
              className={inputClass(false)}
              value={form.values.luogo}
              onChange={(e) => form.setField('luogo', e.target.value)}
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field
            label="Tipo di gara"
            hint={
              amichevole
                ? 'Amichevole: nessun limite di convocati, puoi scegliere tutta la rosa.'
                : 'Campionato: massimo 14 convocati (12 di movimento + 2 liberi).'
            }
          >
            <SegmentedControl
              ariaLabel="Tipo di gara"
              options={TIPI_PARTITA}
              value={form.values.tipo}
              onChange={cambiaTipo}
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field
            label="Squadra da scoutizzare"
            hint="Scegli quale delle due squadre seguire nel rilievo dati."
          >
            <SegmentedControl
              ariaLabel="Squadra da scoutizzare"
              options={opzioniSquadra}
              value={form.values.squadraOsservata}
              onChange={(value) => form.setField('squadraOsservata', value)}
            />
          </Field>
        </div>

        {osservaPropria && (
          <div className="sm:col-span-2">
            <Field
              label="Convocati"
              hint={
                amichevole
                  ? 'Amichevole: puoi convocare tutti i giocatori della rosa, senza limiti di ruolo.'
                  : `Massimo ${MAX_CONVOCATI} convocati con due liberi (12 di movimento), 13 con un solo libero.`
              }
            >
              {giocatori.length === 0 ? (
                <p className="text-sm text-ink-mute">
                  La rosa è vuota: aggiungi i giocatori dalla pagina Rosa.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-mute">
                    {amichevole ? (
                      <span>
                        Convocati:{' '}
                        <b className="text-ink">
                          {convocati.length}/{giocatori.length}
                        </b>{' '}
                        · nessun limite
                      </span>
                    ) : (
                      <>
                        <span>
                          Di movimento:{' '}
                          <b className="text-ink">
                            {nMovimento}/{MAX_MOVIMENTO}
                          </b>
                        </span>
                        <span>
                          Liberi:{' '}
                          <b className="text-ink">
                            {nLiberi}/{MAX_LIBERI}
                          </b>
                        </span>
                      </>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                          title={
                            !amichevole && pieno && !attivo ? 'Limite convocati raggiunto' : undefined
                          }
                          onClick={() => toggleConvocato(giocatore)}
                          className={`${CHIP_CONVOCATO} ${
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
            </Field>
          </div>
        )}

        {/* Submit nascosto: invio da tastiera */}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}
