import { useState } from 'react';
import {
  Calendar,
  CalendarDays,
  ClipboardList,
  Clock,
  Download,
  MapPin,
  Pencil,
  Plus,
  Shirt,
  Trash,
  Upload,
} from 'lucide-react';
import { getPartite, setPartite } from '../services/calendario.js';
import { getSquadraAttiva } from '../services/squadre.js';
import { downloadJSON, openJSONFile } from '../lib/json-io.js';
import { dayMonth, parseDate, shortDate, todayISO } from '../lib/dates.js';
import { useToast } from '../components/Toast.jsx';
import PartitaForm from '../forms/PartitaForm.jsx';
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  PageHeader,
} from '../components/ui.jsx';

export default function Calendario() {
  const toast = useToast();
  const squadra = getSquadraAttiva();
  const [partite, setPartiteState] = useState(() => (squadra ? getPartite(squadra.id) : []));
  const [formState, setFormState] = useState(null); // { partita, index }
  const [toDelete, setToDelete] = useState(null); // { partita, index }
  const [pendingImport, setPendingImport] = useState(null);

  const persist = (list) => {
    setPartite(squadra.id, list);
    setPartiteState(getPartite(squadra.id));
  };

  const openNew = () => setFormState({ partita: null, index: -1 });

  const openEdit = (partita, index) => setFormState({ partita, index });

  const handleSave = (partita) => {
    const list = [...partite];
    if (formState.index >= 0) list[formState.index] = partita;
    else list.push(partita);
    persist(list);
    setFormState(null);
    toast.show(
      formState.index >= 0 ? 'Partita aggiornata con successo.' : 'Partita aggiunta al calendario.',
    );
  };

  const handleDelete = () => {
    const { partita, index } = toDelete;
    persist(partite.filter((_, i) => i !== index));
    setToDelete(null);
    toast.show(`Partita contro ${partita.avversario} eliminata.`, 'info');
  };

  const handleExport = () => {
    downloadJSON(partite, `calendario_${new Date().toISOString().split('T')[0]}.json`);
    toast.show('Calendario esportato in JSON.');
  };

  const handleImportClick = async () => {
    const data = await openJSONFile();
    if (data === null) return;
    if (data?.__invalid || !Array.isArray(data)) {
      toast.show('Il file non contiene un array di partite valido.', 'error');
      return;
    }
    setPendingImport(data);
  };

  const confirmImport = () => {
    setPartite(squadra.id, pendingImport);
    setPartiteState(getPartite(squadra.id));
    setPendingImport(null);
    toast.show('Partite importate con successo!');
  };

  if (!squadra) {
    return (
      <EmptyState
        icon={Shirt}
        title="Nessuna squadra attiva"
        description="Aggiungi una squadra per poter comporre il calendario delle partite."
        action={
          <ButtonLink to="/squadre" variant="primary">
            Gestisci le squadre
          </ButtonLink>
        }
      />
    );
  }

  const today = todayISO();
  const todayTime = parseDate(today).getTime();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarDays}
        title="Calendario partite"
        subtitle={`${partite.length} ${
          partite.length === 1 ? 'partita' : 'partite'
        } in programma · ${squadra.nome}`}
        actions={
          <>
            <Button onClick={openNew}>
              <Plus size={16} />
              Nuova
            </Button>
            <Button variant="outline" onClick={handleImportClick}>
              <Upload size={16} />
              Importa
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={partite.length === 0}>
              <Download size={16} />
              Esporta
            </Button>
          </>
        }
      />

      {partite.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nessuna partita in calendario"
          description="Aggiungi la prima partita oppure importa un file JSON exportato in precedenza."
          action={
            <Button onClick={openNew}>
              <Plus size={16} />
              Aggiungi partita
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {partite.map((partita, index) => {
            const { day, month } = dayMonth(partita.dataISO);
            const isPast = parseDate(partita.dataISO).getTime() < todayTime;
            return (
              <Card
                key={`${partita.dataISO}-${index}`}
                className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${
                  isPast ? 'opacity-70' : ''
                }`}
              >
                <div
                  className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border ${
                    isPast
                      ? 'border-line-strong bg-panel-2 text-ink-soft'
                      : 'border-accent/25 bg-accent/10 text-accent-text'
                  }`}
                >
                  <span className="text-xl font-bold leading-none">{day}</span>
                  <span className="mt-1 text-[10px] font-semibold tracking-widest">{month}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-ink">vs {partita.avversario}</p>
                    {isPast && (
                      <Badge className="bg-panel-2 text-ink-soft ring-1 ring-line-strong">
                        Passata
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={13} className="text-ink-mute" />
                      {shortDate(partita.dataISO)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={13} className="text-ink-mute" />
                      {partita.orarioInizio}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} className="text-ink-mute" />
                      {partita.luogo}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:ml-auto">
                  <ButtonLink
                    to={`/scout/nuovo/${index}`}
                    size="sm"
                    variant="outline"
                    aria-label={`Scout contro ${partita.avversario}`}
                  >
                    <ClipboardList size={14} />
                    Scout
                  </ButtonLink>
                  <IconButton label="Modifica" onClick={() => openEdit(partita, index)}>
                    <Pencil size={15} />
                  </IconButton>
                  <IconButton
                    label="Elimina"
                    variant="danger"
                    onClick={() => setToDelete({ partita, index })}
                  >
                    <Trash size={15} />
                  </IconButton>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {formState && (
        <PartitaForm
          key={formState.index >= 0 ? `edit-${formState.index}` : 'new'}
          open
          partita={formState.partita}
          onCancel={() => setFormState(null)}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Elimina partita"
        message={
          toDelete &&
          `Sei sicuro di voler eliminare la partita contro ${toDelete.partita.avversario}? L'operazione non può essere annullata.`
        }
        confirmLabel="Elimina"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingImport)}
        title="Importa partite"
        message={`Vuoi sostituire le ${partite.length} partite attuali con le ${
          pendingImport?.length ?? 0
        } partite importate?`}
        confirmLabel="Sostituisci"
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />
    </div>
  );
}
