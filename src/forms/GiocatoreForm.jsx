import { Check, UserPlus } from 'lucide-react';
import { RUOLI_GIOCATORE } from '../constants.js';
import { useForm } from '../hooks/useForm.js';
import { Button, Field, Modal, inputClass } from '../components/ui.jsx';

function toFormValues(giocatore) {
  return giocatore
    ? {
        nome: giocatore.nome ?? '',
        cognome: giocatore.cognome ?? '',
        numeroMaglia: giocatore.numeroMaglia ? String(giocatore.numeroMaglia) : '',
        ruolo: giocatore.ruolo ?? '',
      }
    : { nome: '', cognome: '', numeroMaglia: '', ruolo: '' };
}

function validate(values) {
  const errors = {};
  if (!values.nome.trim()) errors.nome = 'Il nome è obbligatorio';
  else if (values.nome.trim().length < 2) errors.nome = 'Il nome deve avere almeno 2 caratteri';

  if (!values.cognome.trim()) errors.cognome = 'Il cognome è obbligatorio';
  else if (values.cognome.trim().length < 2) errors.cognome = 'Il cognome deve avere almeno 2 caratteri';

  const numero = Number(values.numeroMaglia);
  if (values.numeroMaglia === '' || Number.isNaN(numero)) errors.numeroMaglia = 'Il numero di maglia è obbligatorio';
  else if (numero < 1 || numero > 99) errors.numeroMaglia = 'Il numero deve essere tra 1 e 99';

  if (!values.ruolo) errors.ruolo = 'Il ruolo è obbligatorio';

  return errors;
}

export default function GiocatoreForm({ open, giocatore, onCancel, onSave }) {
  const isEditMode = Boolean(giocatore);
  const form = useForm(toFormValues(giocatore), validate);

  const onSubmit = form.handleSubmit((values) => {
    onSave({
      nome: values.nome.trim(),
      cognome: values.cognome.trim(),
      numeroMaglia: Number(values.numeroMaglia),
      ruolo: values.ruolo,
    });
  });

  const onBlur = (field) => () => form.touch(field);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={isEditMode ? 'Modifica giocatore' : 'Nuovo giocatore'}
      icon={UserPlus}
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
        <Field label="Nome *" htmlFor="nome" error={form.showError('nome') && form.errors.nome}>
          <input
            id="nome"
            type="text"
            autoComplete="given-name"
            placeholder="Inserisci il nome"
            className={inputClass(form.showError('nome'))}
            value={form.values.nome}
            onChange={(e) => form.setField('nome', e.target.value)}
            onBlur={onBlur('nome')}
          />
        </Field>

        <Field label="Cognome *" htmlFor="cognome" error={form.showError('cognome') && form.errors.cognome}>
          <input
            id="cognome"
            type="text"
            autoComplete="family-name"
            placeholder="Inserisci il cognome"
            className={inputClass(form.showError('cognome'))}
            value={form.values.cognome}
            onChange={(e) => form.setField('cognome', e.target.value)}
            onBlur={onBlur('cognome')}
          />
        </Field>

        <Field
          label="Numero maglia *"
          htmlFor="numeroMaglia"
          error={form.showError('numeroMaglia') && form.errors.numeroMaglia}
        >
          <input
            id="numeroMaglia"
            type="number"
            min="1"
            max="99"
            inputMode="numeric"
            placeholder="1-99"
            className={inputClass(form.showError('numeroMaglia'))}
            value={form.values.numeroMaglia}
            onChange={(e) => form.setField('numeroMaglia', e.target.value)}
            onBlur={onBlur('numeroMaglia')}
          />
        </Field>

        <Field label="Ruolo *" htmlFor="ruolo" error={form.showError('ruolo') && form.errors.ruolo}>
          <select
            id="ruolo"
            className={`${inputClass(form.showError('ruolo'))} cursor-pointer appearance-none`}
            value={form.values.ruolo}
            onChange={(e) => form.setField('ruolo', e.target.value)}
            onBlur={onBlur('ruolo')}
          >
            <option value="" disabled>
              Seleziona un ruolo
            </option>
            {RUOLI_GIOCATORE.map((ruolo) => (
              <option key={ruolo} value={ruolo}>
                {ruolo}
              </option>
            ))}
          </select>
        </Field>

        {/* Submit nascosto: invio da tastiera */}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}
