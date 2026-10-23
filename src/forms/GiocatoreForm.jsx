import { useRef } from 'react';
import { Check, Image as ImageIcon, Trash, Upload, UserPlus } from 'lucide-react';
import { RUOLI_GIOCATORE } from '../constants.js';
import { useForm } from '../hooks/useForm.js';
import { Button, Field, Modal, inputClass } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';
import { fileToDataUrl } from '../lib/image.js';

function toFormValues(giocatore) {
  return giocatore
    ? {
        nome: giocatore.nome ?? '',
        cognome: giocatore.cognome ?? '',
        numeroMaglia: giocatore.numeroMaglia ? String(giocatore.numeroMaglia) : '',
        ruolo: giocatore.ruolo ?? '',
        foto: giocatore.foto ?? '',
      }
    : { nome: '', cognome: '', numeroMaglia: '', ruolo: '', foto: '' };
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
  const toast = useToast();
  const form = useForm(toFormValues(giocatore), validate);
  const fileRef = useRef(null);

  const onSubmit = form.handleSubmit((values) => {
    onSave({
      id: giocatore?.id,
      nome: values.nome.trim(),
      cognome: values.cognome.trim(),
      numeroMaglia: Number(values.numeroMaglia),
      ruolo: values.ruolo,
      foto: values.foto,
    });
  });

  const onBlur = (field) => () => form.touch(field);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      // Foto contenuta: il profilo non ha bisogno della risoluzione piena e
      // la localStorage resta leggera anche con una rosa numerosa.
      const dataUrl = await fileToDataUrl(file, { maxWidth: 600, maxHeight: 600, quality: 0.8 });
      form.setField('foto', dataUrl);
      toast.show('Foto pronta: premi Salva per confermarla.', 'info');
    } catch (error) {
      toast.show(error.message || "Impossibile leggere l'immagine.", 'error');
    }
  };

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
        <div className="sm:col-span-2">
          <Field label="Foto profilo" hint="Facoltativa: viene mostrata nella rosa e nella pagina del giocatore.">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line-strong bg-panel-2 text-ink-mute">
                {form.values.foto ? (
                  <img
                    src={form.values.foto}
                    alt="Anteprima foto giocatore"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon size={24} />
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                  aria-label="Seleziona foto profilo"
                />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload size={15} />
                  Carica foto
                </Button>
                {form.values.foto && (
                  <Button variant="danger" size="sm" onClick={() => form.setField('foto', '')}>
                    <Trash size={15} />
                    Rimuovi foto
                  </Button>
                )}
              </div>
            </div>
          </Field>
        </div>

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
