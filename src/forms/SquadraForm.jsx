import { useRef } from 'react';
import { Check, Image as ImageIcon, Shirt, Trash, Upload } from 'lucide-react';
import { useForm } from '../hooks/useForm.js';
import { Button, Field, Modal, inputClass } from '../components/ui.jsx';
import { fotoSquadra } from '../services/squadre.js';
import { fileToDataUrl } from '../lib/image.js';
import { useToast } from '../components/Toast.jsx';

function toFormValues(squadra) {
  return squadra
    ? {
        nome: squadra.nome ?? '',
        club: squadra.club ?? '',
        stagione: squadra.stagione ?? '',
        foto: squadra.foto ?? '',
        fotoUrl: squadra.fotoUrl ?? '',
      }
    : { nome: '', club: '', stagione: '', foto: '', fotoUrl: '' };
}

function validate(values) {
  const errors = {};
  if (!values.nome.trim()) errors.nome = 'Il nome è obbligatorio';
  else if (values.nome.trim().length < 2) errors.nome = 'Il nome deve avere almeno 2 caratteri';

  return errors;
}

export default function SquadraForm({ open, squadra, onCancel, onSave }) {
  const isEditMode = Boolean(squadra);
  const toast = useToast();
  const form = useForm(toFormValues(squadra), validate);
  const fileRef = useRef(null);

  const onSubmit = form.handleSubmit((values) => {
    onSave({
      id: squadra?.id,
      nome: values.nome.trim(),
      club: values.club.trim(),
      stagione: values.stagione.trim(),
      foto: values.foto,
      fotoUrl: values.fotoUrl.trim(),
    });
  });

  const onBlur = (field) => () => form.touch(field);

  const anteprima = fotoSquadra({ foto: form.values.foto, fotoUrl: form.values.fotoUrl });

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      form.setField('foto', dataUrl);
      form.setField('fotoUrl', '');
      toast.show('Immagine pronta: premi Salva per confermarla.', 'info');
    } catch (error) {
      toast.show(error.message || "Impossibile leggere l'immagine.", 'error');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={isEditMode ? 'Modifica squadra' : 'Nuova squadra'}
      icon={Shirt}
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
          <Field label="Nome *" htmlFor="nome" error={form.showError('nome') && form.errors.nome}>
            <input
              id="nome"
              type="text"
              autoComplete="off"
              placeholder="Es. Prima Divisione Maschile"
              className={inputClass(form.showError('nome'))}
              value={form.values.nome}
              onChange={(e) => form.setField('nome', e.target.value)}
              onBlur={onBlur('nome')}
            />
          </Field>
        </div>

        <Field label="Club" htmlFor="club">
          <input
            id="club"
            type="text"
            autoComplete="organization"
            placeholder="Es. 1DM Albano Circo"
            className={inputClass(false)}
            value={form.values.club}
            onChange={(e) => form.setField('club', e.target.value)}
            onBlur={onBlur('club')}
          />
        </Field>

        <Field label="Stagione" htmlFor="stagione">
          <input
            id="stagione"
            type="text"
            autoComplete="off"
            placeholder="Es. 2025/2026"
            className={inputClass(false)}
            value={form.values.stagione}
            onChange={(e) => form.setField('stagione', e.target.value)}
            onBlur={onBlur('stagione')}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field
            label="Foto di copertina"
            htmlFor="fotoUrl"
            hint={
              form.values.foto
                ? 'La foto caricata dal dispositivo ha la precedenza sull’URL'
                : 'Facoltativa: usata come copertina nella Home'
            }
          >
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
                aria-label="Seleziona immagine"
              />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload size={15} />
                Carica immagine
              </Button>
              {form.values.foto && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => form.setField('foto', '')}
                >
                  <Trash size={15} />
                  Rimuovi foto
                </Button>
              )}
            </div>
            {anteprima ? (
              <img
                src={anteprima}
                alt="Anteprima foto squadra"
                className="mt-3 h-36 w-full rounded-xl border border-line object-cover"
              />
            ) : (
              <div className="mt-3 flex h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-panel-2 text-ink-mute">
                <ImageIcon size={22} />
                <p className="text-xs">Nessuna foto: verrà usato il motivo grafico</p>
              </div>
            )}
            <input
              id="fotoUrl"
              type="url"
              placeholder="Oppure incolla un URL: https://…/foto.jpg"
              className={`${inputClass(false)} mt-3`}
              value={form.values.fotoUrl}
              onChange={(e) => form.setField('fotoUrl', e.target.value)}
              onBlur={onBlur('fotoUrl')}
            />
          </Field>
        </div>

        {/* Submit nascosto: invio da tastiera */}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}
