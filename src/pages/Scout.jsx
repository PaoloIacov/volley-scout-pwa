import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Calendar, ClipboardList, Clock, MapPin, Plus, Trash } from 'lucide-react';
import { creaScout, eliminaScout, getScoutList } from '../services/scout.js';
import { getPartite } from '../services/calendario.js';
import { useSquadraAttiva } from '../hooks/useSquadre.js';
import { dayMonth, shortDate } from '../lib/dates.js';
import { useToast } from '../components/Toast.jsx';
import ScoutForm from '../forms/ScoutForm.jsx';
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

export default function Scout() {
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { partitaIndex } = useParams();
  const squadra = useSquadraAttiva();
  const [scoutList, setScoutList] = useState(() => (squadra ? getScoutList(squadra.id) : []));
  const [toDelete, setToDelete] = useState(null); // scout da eliminare

  // Arrivo da "/scout/nuovo" (Home) o da "/scout/nuovo/:partitaIndex" (Calendario).
  const formAperto =
    Boolean(squadra) && (pathname === '/scout/nuovo' || partitaIndex !== undefined);

  const prefill = (() => {
    if (partitaIndex === undefined || !squadra) return null;
    const partita = getPartite(squadra.id)[Number(partitaIndex)];
    if (!partita) return null;
    return {
      data: partita.dataISO,
      orarioInizio: partita.orarioInizio,
      avversario: partita.avversario,
      luogo: partita.luogo,
    };
  })();

  const chiudiForm = () => navigate('/scout', { replace: true });

  const handleSave = (dati) => {
    const scout = creaScout({ ...dati, squadraId: squadra.id });
    toast.show(`Scout contro ${scout.avversario} creato. Buon lavoro!`);
    navigate(`/scout/${scout.id}`, { replace: true });
  };

  const handleDelete = () => {
    eliminaScout(toDelete.id);
    setScoutList(getScoutList(squadra.id));
    setToDelete(null);
    toast.show(`Scout contro ${toDelete.avversario} eliminato.`, 'info');
  };

  if (!squadra) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Nessuna squadra attiva"
        description="Aggiungi una squadra per poter creare gli scout delle partite."
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
        icon={ClipboardList}
        title="Scout"
        subtitle={`${scoutList.length} ${scoutList.length === 1 ? 'rilevamento' : 'rilevamenti'} · ${squadra.nome}`}
        actions={
          <ButtonLink to="/scout/nuovo">
            <Plus size={16} />
            Nuovo scout
          </ButtonLink>
        }
      />

      {scoutList.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nessuno scout ancora"
          description="Crea il primo rilevamento statistico: puoi farlo anche da una partita del calendario."
          action={
            <ButtonLink to="/scout/nuovo" variant="primary">
              <Plus size={16} />
              Nuovo scout
            </ButtonLink>
          }
        />
      ) : (
        <div className="space-y-3">
          {scoutList.map((scout) => {
            const { day, month } = dayMonth(scout.data);
            return (
              <Card key={scout.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-accent/25 bg-accent/10 text-accent-text">
                  <span className="text-xl font-bold leading-none">{day}</span>
                  <span className="mt-1 text-[10px] font-semibold tracking-widest">{month}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-ink">vs {scout.avversario}</p>
                    <Badge
                      className={
                        scout.squadraOsservata === 'propria'
                          ? 'bg-accent/15 text-accent-text ring-1 ring-accent/25'
                          : 'bg-panel-2 text-ink-soft ring-1 ring-line-strong'
                      }
                    >
                      {scout.squadraOsservata === 'propria' ? squadra.nome : 'Avversaria'}
                    </Badge>
                    <Badge className="bg-panel-2 text-ink-soft ring-1 ring-line-strong">
                      {scout.azioni.length} {scout.azioni.length === 1 ? 'azione' : 'azioni'}
                    </Badge>
                    <Badge className="bg-panel-2 text-ink-soft ring-1 ring-line-strong">
                      Set {scout.setCorrente}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={13} className="text-ink-mute" />
                      {shortDate(scout.data)}
                    </span>
                    {scout.orarioInizio && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} className="text-ink-mute" />
                        {scout.orarioInizio}
                      </span>
                    )}
                    {scout.luogo && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={13} className="text-ink-mute" />
                        {scout.luogo}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-ink-mute">
                      {scout.sets.length} set giocati
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 sm:ml-auto">
                  <ButtonLink to={`/scout/${scout.id}`} size="sm" variant="outline">
                    Apri
                  </ButtonLink>
                  <IconButton label="Elimina" variant="danger" onClick={() => setToDelete(scout)}>
                    <Trash size={15} />
                  </IconButton>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {formAperto && (
        <ScoutForm
          key={partitaIndex ?? 'new'}
          open
          prefill={prefill}
          squadra={squadra}
          onCancel={chiudiForm}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Elimina scout"
        message={
          toDelete &&
          `Sei sicuro di voler eliminare lo scout contro ${toDelete.avversario}? Verranno persi i ${toDelete.azioni.length} dati rilevati. L'operazione non può essere annullata.`
        }
        confirmLabel="Elimina"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
