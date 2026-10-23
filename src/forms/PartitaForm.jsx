import { CalendarPlus, Check } from 'lucide-react';
import { useForm } from '../hooks/useForm.js';
import { Button, Field, Modal, SegmentedControl, inputClass } from '../components/ui.jsx';
import { toISO } from '../lib/dates.js';

const TIPI_PARTITA = [
  { value: 'campionato', label: 'Campionato' },
  { value: 'amichevole', label: 'Amichevole' },
];

function toFormValues(partita) {
  return partita
    ? {
        data: toISO(partita.data),
        orarioInizio: partita.orarioInizio ?? '',
        avversario: partita.avversario ?? '',
        luogo: partita.luogo ?? '',
        tipo: partita.tipo === 'amichevole' ? 'amichevole' : 'campionato',
      }
    : { data: '', orarioInizio: '', avversario: '', luogo: '', tipo: 'campionato' };
}

function validate(values) {
  const errors = {};
  if (!values.data) errors.data = 'La data è obbligatoria';
  if (!values.orarioInizio) errors.orarioInizio = "L'orario è obbligatorio";

  if (!values.avversario.trim()) errors.avversario = "L'avversario è obbligatorio";
  else if (values.avversario.trim().length < 2)
    errors.avversario = "L'avversario deve avere almeno 2 caratteri";

  if (!values.luogo.trim()) errors.luogo = 'Il luogo è obbligatorio';
  else if (values.luogo.trim().length < 2) errors.luogo = 'Il luogo deve avere almeno 2 caratteri';

  return errors;
}

export default function PartitaForm({ open, partita, onCancel, onSave }) {
  const isEditMode = Boolean(partita);
  const form = useForm(toFormValues(partita), validate);

  const onSubmit = form.handleSubmit((values) => {
    onSave({
      data: values.data,
      orarioInizio: values.orarioInizio,
      avversario: values.avversario.trim(),
      luogo: values.luogo.trim(),
      tipo: values.tipo,
    });
  });

  const onBlur = (field) => () => form.touch(field);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={isEditMode ? 'Modifica partita' : 'Nuova partita'}
      icon={CalendarPlus}
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            Annulla
          </Button>
          <Button variant="primary" onClick={onSubmit} disabled={!form.isValid}>
            <Check size={16} />
            {isEditMode ? 'Salva' : 'Aggiungi'}
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

        <Field label="Orario *" htmlFor="orarioInizio" error={form.showError('orarioInizio') && form.errors.orarioInizio}>
          <input
            id="orarioInizio"
            type="time"
            className={inputClass(form.showError('orarioInizio'))}
            value={form.values.orarioInizio}
            onChange={(e) => form.setField('orarioInizio', e.target.value)}
            onBlur={onBlur('orarioInizio')}
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
          <Field
            label="Tipo di gara"
            hint="In campionato i convocati sono limitati (12 di movimento + 2 liberi); nelle amichevoli non c'è limite e si possono convocare tutti."
          >
            <SegmentedControl
              ariaLabel="Tipo di gara"
              options={TIPI_PARTITA}
              value={form.values.tipo}
              onChange={(value) => form.setField('tipo', value)}
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Luogo *" htmlFor="luogo" error={form.showError('luogo') && form.errors.luogo}>
            <input
              id="luogo"
              type="text"
              placeholder="Campo di gioco"
              className={inputClass(form.showError('luogo'))}
              value={form.values.luogo}
              onChange={(e) => form.setField('luogo', e.target.value)}
              onBlur={onBlur('luogo')}
            />
          </Field>
        </div>

        {/* Submit nascosto: invio da tastiera */}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}
