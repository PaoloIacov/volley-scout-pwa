import { useState } from 'react';
import { CalendarDays, Pencil, Plus, Shirt, Trash, Users } from 'lucide-react';
import {
  contaDatiSquadra,
  fotoSquadra,
  getSquadraAttiva,
  getSquadre,
  rimuoviSquadra,
  salvaSquadra,
  setSquadraAttiva,
} from '../services/squadre.js';
import { useToast } from '../components/Toast.jsx';
import SquadraForm from '../forms/SquadraForm.jsx';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  PageHeader,
} from '../components/ui.jsx';

export default function Squadre() {
  const toast = useToast();
  const [squadre, setSquadreState] = useState(() => getSquadre());
  const [attivaId, setAttivaIdState] = useState(() => getSquadraAttiva()?.id ?? null);
  const [formState, setFormState] = useState(null); // { squadra, index }
  const [toDelete, setToDelete] = useState(null); // { squadra, index }

  const refresh = () => {
    setSquadreState(getSquadre());
    setAttivaIdState(getSquadraAttiva()?.id ?? null);
  };

  const openNew = () => setFormState({ squadra: null, index: -1 });

  const openEdit = (squadra, index) => setFormState({ squadra, index });

  const handleSave = (squadra) => {
    salvaSquadra(squadra);
    refresh();
    setFormState(null);
    toast.show(
      formState.index >= 0 ? 'Squadra aggiornata con successo.' : 'Squadra aggiunta con successo.'
    );
  };

  const handleActivate = (squadra) => {
    setSquadraAttiva(squadra.id);
    refresh();
    toast.show(`${squadra.nome} è la squadra attiva.`, 'info');
  };

  const handleDelete = () => {
    const { squadra } = toDelete;
    rimuoviSquadra(squadra.id);
    refresh();
    setToDelete(null);
    toast.show(`Squadra ${squadra.nome} eliminata.`, 'info');
  };

  const attiva = squadre.find((squadra) => squadra.id === attivaId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Shirt}
        title="Gestione squadre"
        subtitle={`${squadre.length} ${
          squadre.length === 1 ? 'squadra registrata' : 'squadre registrate'
        } · attiva: ${attiva?.nome ?? 'nessuna'}`}
        actions={
          <Button onClick={openNew}>
            <Plus size={16} />
            Nuova
          </Button>
        }
      />

      {squadre.length === 0 ? (
        <EmptyState
          icon={Shirt}
          title="Nessuna squadra"
          description="Aggiungi la prima squadra: ognuna ha la sua rosa di giocatori e il suo calendario partite."
          action={
            <Button onClick={openNew}>
              <Plus size={16} />
              Aggiungi squadra
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {squadre.map((squadra, index) => {
            const isActive = squadra.id === attivaId;
            const counts = contaDatiSquadra(squadra.id);
            const copertina = fotoSquadra(squadra);
            const meta = [squadra.club, squadra.stagione].filter(Boolean).join(' · ');
            return (
              <Card
                key={squadra.id || index}
                className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${
                  isActive ? 'border-accent/40 bg-accent/10' : ''
                }`}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-accent to-accent-strong text-on-accent shadow-lg shadow-accent/30 ring-1 ring-accent/30">
                  {copertina ? (
                    <img
                      src={copertina}
                      alt={squadra.nome}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Shirt size={22} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink sm:text-base">
                      {squadra.nome}
                    </p>
                    {isActive && <Badge className="bg-accent text-on-accent">Attiva</Badge>}
                  </div>
                  <p className="mt-1 truncate text-xs text-ink-soft">
                    {meta || 'Nessun club o stagione'}
                  </p>
                  <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-mute">
                    <span className="inline-flex items-center gap-1">
                      <Users size={12} className="text-accent-text" />
                      {counts.giocatori} giocatori
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={12} className="text-accent-text" />
                      {counts.partite} partite
                    </span>
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:ml-auto">
                  {!isActive && (
                    <Button size="sm" variant="outline" onClick={() => handleActivate(squadra)}>
                      Rendi attiva
                    </Button>
                  )}
                  <IconButton label="Modifica" onClick={() => openEdit(squadra, index)}>
                    <Pencil size={15} />
                  </IconButton>
                  <IconButton
                    label="Elimina"
                    variant="danger"
                    onClick={() => setToDelete({ squadra, index })}
                  >
                    <Trash size={15} />
                  </IconButton>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-ink-mute">
        La squadra attiva è quella mostrata nella Home, nella rosa dei giocatori e nel calendario.
      </p>

      {formState && (
        <SquadraForm
          key={formState.index >= 0 ? `edit-${formState.index}` : 'new'}
          open
          squadra={formState.squadra}
          onCancel={() => setFormState(null)}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Elimina squadra"
        message={
          toDelete &&
          `Sei sicuro di voler eliminare "${toDelete.squadra.nome}"? Anche i ${
            contaDatiSquadra(toDelete.squadra.id).giocatori
          } giocatori e le ${
            contaDatiSquadra(toDelete.squadra.id).partite
          } partite associate verranno eliminati. L'operazione non può essere annullata.`
        }
        confirmLabel="Elimina"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
