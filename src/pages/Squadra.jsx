import { useState } from 'react';
import {
  ArrowUpRight,
  Download,
  Hand,
  Pencil,
  Plus,
  Shield,
  ShieldCheck,
  Shirt,
  Trash,
  Upload,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { getGiocatori, setGiocatori } from '../services/giocatori.js';
import { getSquadraAttiva } from '../services/squadre.js';
import { downloadJSON, openJSONFile } from '../lib/json-io.js';
import { useToast } from '../components/Toast.jsx';
import GiocatoreForm from '../forms/GiocatoreForm.jsx';
import {
  Button,
  ButtonLink,
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  PageHeader,
} from '../components/ui.jsx';

const RUOLO_ICONS = {
  Schiacciatore: Zap,
  Opposto: ArrowUpRight,
  Centrale: Shield,
  Libero: ShieldCheck,
  Palleggiatore: Hand,
};

function ruoloIcon(ruolo) {
  if (!ruolo) return User;
  const key = ruolo.charAt(0).toUpperCase() + ruolo.slice(1).toLowerCase();
  return RUOLO_ICONS[key] ?? User;
}

export default function Squadra() {
  const toast = useToast();
  const squadra = getSquadraAttiva();
  const [giocatori, setGiocatoriState] = useState(() => (squadra ? getGiocatori(squadra.id) : []));
  const [formState, setFormState] = useState(null); // { giocatore, index }
  const [toDelete, setToDelete] = useState(null); // { giocatore, index }
  const [pendingImport, setPendingImport] = useState(null);

  const persist = (list) => {
    setGiocatori(squadra.id, list);
    setGiocatoriState(getGiocatori(squadra.id));
  };

  const openNew = () => setFormState({ giocatore: null, index: -1 });

  const openEdit = (giocatore, index) => setFormState({ giocatore, index });

  const handleSave = (giocatore) => {
    const list = [...giocatori];
    if (formState.index >= 0) list[formState.index] = giocatore;
    else list.push(giocatore);
    persist(list);
    setFormState(null);
    toast.show(
      formState.index >= 0 ? 'Giocatore aggiornato con successo.' : 'Giocatore aggiunto alla rosa.'
    );
  };

  const handleDelete = () => {
    const { giocatore, index } = toDelete;
    persist(giocatori.filter((_, i) => i !== index));
    setToDelete(null);
    toast.show(`${giocatore.nome} ${giocatore.cognome} rimosso dalla rosa.`, 'info');
  };

  const handleExport = () => {
    downloadJSON(giocatori, `giocatori_${new Date().toISOString().split('T')[0]}.json`);
    toast.show('Rosa esportata in JSON.');
  };

  const handleImportClick = async () => {
    const data = await openJSONFile();
    if (data === null) return;
    if (data?.__invalid || !Array.isArray(data)) {
      toast.show('Il file non contiene un array di giocatori valido.', 'error');
      return;
    }
    setPendingImport(data);
  };

  const confirmImport = () => {
    setGiocatori(squadra.id, pendingImport);
    setGiocatoriState(getGiocatori(squadra.id));
    setPendingImport(null);
    toast.show('Giocatori importati con successo!');
  };

  if (!squadra) {
    return (
      <EmptyState
        icon={Shirt}
        title="Nessuna squadra attiva"
        description="Aggiungi una squadra per poter gestire la rosa dei giocatori."
        action={
          <ButtonLink to="/squadre" variant="primary">
            Gestisci le squadre
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Gestione giocatori"
        subtitle={`${giocatori.length} ${
          giocatori.length === 1 ? 'giocatore' : 'giocatori'
        } in rosa · ${squadra.nome}`}
        actions={
          <>
            <Button onClick={openNew}>
              <Plus size={16} />
              Nuovo
            </Button>
            <Button variant="outline" onClick={handleImportClick}>
              <Upload size={16} />
              Importa
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={giocatori.length === 0}>
              <Download size={16} />
              Esporta
            </Button>
          </>
        }
      />

      {giocatori.length === 0 ? (
        <EmptyState
          icon={Users}
          title="La rosa è vuota"
          description="Aggiungi il primo giocatore oppure importa un file JSON exportato in precedenza."
          action={
            <Button onClick={openNew}>
              <Plus size={16} />
              Aggiungi giocatore
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {giocatori.map((giocatore, index) => {
            const Icon = ruoloIcon(giocatore.ruolo);
            return (
              <Card key={`${giocatore.numeroMaglia}-${index}`} className="flex items-center gap-4 p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-strong text-lg font-bold text-on-accent shadow-lg shadow-accent/30">
                  {giocatore.numeroMaglia}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink sm:text-base">
                    {giocatore.nome} {giocatore.cognome}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
                    <Icon size={14} className="text-accent-text" />
                    {giocatore.ruolo}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <IconButton label="Modifica" onClick={() => openEdit(giocatore, index)}>
                    <Pencil size={15} />
                  </IconButton>
                  <IconButton label="Elimina" variant="danger" onClick={() => setToDelete({ giocatore, index })}>
                    <Trash size={15} />
                  </IconButton>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {formState && (
        <GiocatoreForm
          key={formState.index >= 0 ? `edit-${formState.index}` : 'new'}
          open
          giocatore={formState.giocatore}
          onCancel={() => setFormState(null)}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Elimina giocatore"
        message={
          toDelete &&
          `Sei sicuro di voler eliminare ${toDelete.giocatore.nome} ${toDelete.giocatore.cognome}? L'operazione non può essere annullata.`
        }
        confirmLabel="Elimina"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingImport)}
        title="Importa giocatori"
        message={`Vuoi sostituire i ${giocatori.length} giocatori attuali con i ${
          pendingImport?.length ?? 0
        } giocatori importati?`}
        confirmLabel="Sostituisci"
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />
    </div>
  );
}
