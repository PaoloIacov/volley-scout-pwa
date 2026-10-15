import { ClipboardList, Play } from 'lucide-react';
import { useForm } from '../hooks/useForm.js';
import { Button, Field, Modal, SegmentedControl, inputClass } from '../components/ui.jsx';
import { todayISO } from '../lib/dates.js';

function toFormValues(prefill) {
  return {
    data: prefill?.data || todayISO(),
    orarioInizio: prefill?.orarioInizio ?? '',
    avversario: prefill?.avversario ?? '',
    luogo: prefill?.luogo ?? '',
    squadraOsservata: 'propria',
  };
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
 * squadre scoutizzare.
 */
export default function ScoutForm({ open, prefill, squadra, onCancel, onSave }) {
  const form = useForm(toFormValues(prefill), validate);

  const onSubmit = form.handleSubmit((values) => {
    onSave({
      data: values.data,
      orarioInizio: values.orarioInizio.trim(),
      avversario: values.avversario.trim(),
      luogo: values.luogo.trim(),
      squadraOsservata: values.squadraOsservata,
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

        {/* Submit nascosto: invio da tastiera */}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}
