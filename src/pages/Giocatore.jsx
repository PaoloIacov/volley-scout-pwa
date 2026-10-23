import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Pencil,
  Target,
  TrendingUp,
  TriangleAlert,
  User,
  Zap,
} from 'lucide-react';
import { useSquadraAttiva } from '../hooks/useSquadre.js';
import { aggiornaGiocatore, getGiocatore } from '../services/giocatori.js';
import { getScoutList } from '../services/scout.js';
import {
  AZIONI,
  ESITI,
  ESITO_CLASSI,
  statisticheGiocatore,
} from '../lib/scout-stats.js';
import { toItalianDate } from '../lib/dates.js';
import { useToast } from '../components/Toast.jsx';
import GiocatoreForm from '../forms/GiocatoreForm.jsx';
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
} from '../components/ui.jsx';

/** Riquadro sintetico di una statistica del giocatore. */
function Statistica({ icon: Icon, label, valore, tono = 'text-ink' }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-text ring-1 ring-accent/25">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className={`text-2xl font-semibold leading-none tabular-nums ${tono}`}>{valore}</p>
        <p className="mt-1.5 text-xs text-ink-mute">{label}</p>
      </div>
    </Card>
  );
}

/** Numero in una sotto-colonna della tabella per azione. */
function CellaEsito({ valore, esito }) {
  return (
    <td className="border-t border-line-strong/60 p-1 text-center align-middle">
      <span className="flex h-9 min-w-9 items-center justify-center">
        {valore ? (
          <span
            className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-xs font-bold tabular-nums ring-1 ${ESITO_CLASSI[esito].tondo}`}
          >
            {valore}
          </span>
        ) : (
          <span className="text-base leading-none text-ink-faint">·</span>
        )}
      </span>
    </td>
  );
}

/**
 * Pagina profilo del giocatore: anagrafica modificabile (foto compresa) e
 * statistiche complessive calcolate su tutti gli scout della squadra.
 */
export default function Giocatore() {
  const { id } = useParams();
  const squadra = useSquadraAttiva();
  const toast = useToast();
  const [giocatore, setGiocatore] = useState(() => getGiocatore(id));
  const [formOpen, setFormOpen] = useState(false);

  // Se cambia il parametro della rotta (o si torna sul profilo dopo un'altra
  // modifica) si rilegge il giocatore dallo storage.
  useEffect(() => {
    setGiocatore(getGiocatore(id));
  }, [id]);

  if (!giocatore || (squadra && giocatore.squadraId !== squadra.id)) {
    return (
      <EmptyState
        icon={User}
        title="Giocatore non trovato"
        description="Il giocatore non esiste più oppure non appartiene alla squadra attiva."
        action={
          <ButtonLink to="/squadra" variant="primary">
            <ArrowLeft size={16} />
            Torna alla rosa
          </ButtonLink>
        }
      />
    );
  }

  const scouts = squadra ? getScoutList(squadra.id) : [];
  const statistiche = statisticheGiocatore(giocatore, scouts);
  const nomeCompleto = `${giocatore.nome} ${giocatore.cognome}`.trim();

  const handleSave = (dati) => {
    const aggiornato = aggiornaGiocatore(giocatore.id, dati);
    if (!aggiornato) {
      toast.show('Impossibile aggiornare il giocatore.', 'error');
      return;
    }
    setGiocatore(aggiornato);
    setFormOpen(false);
    toast.show('Dati del giocatore aggiornati con successo.');
  };

  return (
    <div className="space-y-6">
      {/* Intestazione con foto e anagrafica */}
      <Card className="p-0">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center self-center overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-accent-strong text-3xl font-bold text-on-accent shadow-xl shadow-accent/30 sm:self-start">
            {giocatore.foto ? (
              <img
                src={giocatore.foto}
                alt={`Foto di ${nomeCompleto}`}
                className="h-full w-full object-cover"
              />
            ) : (
              giocatore.numeroMaglia
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
                  Profilo giocatore
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  {nomeCompleto}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className="bg-accent/15 text-accent-text ring-1 ring-accent/25">
                    {giocatore.ruolo}
                  </Badge>
                  <Badge className="bg-panel-2 text-ink-soft ring-1 ring-line-strong">
                    N. {giocatore.numeroMaglia}
                  </Badge>
                  {squadra && (
                    <span className="text-xs text-ink-mute">{squadra.nome}</span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <ButtonLink to="/squadra" variant="outline" size="sm">
                  <ArrowLeft size={15} />
                  Rosa
                </ButtonLink>
                <Button size="sm" onClick={() => setFormOpen(true)}>
                  <Pencil size={15} />
                  Modifica dati
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Sintesi complessiva */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Statistica
          icon={ClipboardList}
          label="Scout con dati"
          valore={statistiche.partite.length}
        />
        <Statistica icon={TrendingUp} label="Azioni rilevate" valore={statistiche.azioni} />
        <Statistica
          icon={Zap}
          label="Punti fatti"
          valore={statistiche.sintesi.puntiFatti}
          tono="text-ok"
        />
        <Statistica
          icon={TriangleAlert}
          label="Errori fatti"
          valore={statistiche.sintesi.erroriFatti}
          tono="text-ko"
        />
        <Statistica
          icon={Target}
          label="Palloni attaccati"
          valore={statistiche.sintesi.palloniAttaccati}
        />
        <Statistica
          icon={CalendarDays}
          label="Set giocati"
          valore={statistiche.setGiocati}
        />
      </div>

      {statistiche.azioni === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nessuna statistica disponibile"
          description="Le statistiche compaiono quando il giocatore viene rilevato in almeno uno scout della squadra. Crea un nuovo scout oppure registra le sue azioni da una sessione esistente."
          action={
            <ButtonLink to="/scout/nuovo" variant="primary">
              <ClipboardList size={16} />
              Nuovo scout
            </ButtonLink>
          }
        />
      ) : (
        <>
          <Card className="overflow-hidden p-0">
            <div className="border-b border-line bg-panel-2 px-3 py-2">
              <p className="text-sm font-semibold text-ink">Statistiche per azione</p>
              <p className="text-xs text-ink-mute">
                Somma di tutti gli scout della squadra · {statistiche.azioni}{' '}
                {statistiche.azioni === 1 ? 'azione' : 'azioni'} su {statistiche.setGiocati}{' '}
                {statistiche.setGiocati === 1 ? 'set' : 'set'}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table
                aria-label={`Statistiche di ${nomeCompleto}`}
                className="w-full min-w-[560px] border-separate border-spacing-0 text-left"
              >
                <thead>
                  <tr className="bg-panel-2 text-[11px] font-semibold uppercase tracking-wider">
                    <th
                      scope="col"
                      className="border-b border-line-strong bg-panel-2 px-4 py-3 text-left text-ink"
                    >
                      Azione
                    </th>
                    {ESITI.map((esito) => (
                      <th
                        key={esito.id}
                        scope="col"
                        className="border-b border-line-strong bg-panel-2 px-2 py-3 text-center"
                      >
                        <span
                          className={`inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-[11px] font-bold ${ESITO_CLASSI[esito.id].tondo}`}
                        >
                          {esito.id}
                        </span>
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="border-b border-l-2 border-line-strong bg-panel-2 px-3 py-3 text-center text-ink"
                    >
                      Tot
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {AZIONI.map((azione, index) => {
                    const cella = statistiche.celle[azione.id];
                    return (
                      <tr
                        key={azione.id}
                        className={`transition-colors hover:bg-accent/5 ${
                          index % 2 === 1 ? 'bg-panel-2/65' : ''
                        }`}
                      >
                        <th
                          scope="row"
                          className="border-t border-line-strong/60 px-4 py-2 text-left text-sm font-medium text-ink"
                        >
                          {azione.label}
                        </th>
                        {ESITI.map((esito) => (
                          <CellaEsito key={esito.id} valore={cella[esito.id]} esito={esito.id} />
                        ))}
                        <td className="border-t border-l-2 border-line-strong/60 px-3 py-2 text-center text-sm font-bold tabular-nums text-ink">
                          {cella.tot}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-panel-2">
                    <td className="border-t-2 border-line-strong px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink">
                      Totale
                    </td>
                    {ESITI.map((esito) => (
                      <CellaEsito
                        key={esito.id}
                        valore={statistiche.totaliPerEsito[esito.id]}
                        esito={esito.id}
                      />
                    ))}
                    <td className="border-t-2 border-l-2 border-line-strong px-3 py-3 text-center text-sm font-bold tabular-nums text-ink">
                      {statistiche.azioni}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line px-4 py-3 text-xs text-ink-mute">
              <span className="font-semibold uppercase tracking-wider">Legenda:</span>
              {ESITI.map((esito) => (
                <span key={esito.id} className="inline-flex items-center gap-1.5">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold ring-1 ${ESITO_CLASSI[esito.id].tondo}`}
                  >
                    {esito.id}
                  </span>
                  {esito.breve}
                </span>
              ))}
            </div>
            <div className="border-t border-line px-4 py-2 text-[11px] text-ink-mute">
              <span className="font-semibold text-ink">Punti fatti</span>: # in attacco, muro e
              battuta · <span className="font-semibold text-ink">Errori fatti</span>: = in tutte le
              azioni · <span className="font-semibold text-ink">Palloni attaccati</span>: tutte le
              azioni di attacco.
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-line bg-panel-2 px-3 py-2">
              <p className="text-sm font-semibold text-ink">Scout analizzati</p>
              <p className="text-xs text-ink-mute">
                Tutte le partite in cui il giocatore ha almeno un&apos;azione rilevata.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table
                aria-label={`Scout di ${nomeCompleto}`}
                className="w-full min-w-[620px] border-separate border-spacing-0 text-left"
              >
                <thead>
                  <tr className="bg-panel-2 text-[11px] font-semibold uppercase tracking-wider">
                    {['Data', 'Avversario', 'Tipo', 'Set', 'Azioni', 'Punti', 'Errori', 'Attacchi'].map(
                      (label, index) => (
                        <th
                          key={label}
                          scope="col"
                          className={`border-b border-line-strong bg-panel-2 px-3 py-3 ${
                            index === 0 || index === 1 ? 'text-left' : 'text-center'
                          } text-ink`}
                        >
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {statistiche.partite.map((partita, index) => (
                    <tr
                      key={`${partita.id}-${index}`}
                      className={`transition-colors hover:bg-accent/5 ${
                        index % 2 === 1 ? 'bg-panel-2/65' : ''
                      }`}
                    >
                      <td className="border-t border-line-strong/60 px-3 py-2 text-sm text-ink">
                        {toItalianDate(partita.data) || '—'}
                      </td>
                      <td className="border-t border-line-strong/60 px-3 py-2 text-sm text-ink">
                        {partita.avversario || '—'}
                      </td>
                      <td className="border-t border-line-strong/60 px-3 py-2 text-center text-xs text-ink-soft">
                        {partita.tipo === 'amichevole' ? 'Amichevole' : 'Campionato'}
                      </td>
                      <td className="border-t border-line-strong/60 px-3 py-2 text-center text-sm tabular-nums text-ink-soft">
                        {partita.setGiocati}
                      </td>
                      <td className="border-t border-line-strong/60 px-3 py-2 text-center text-sm font-semibold tabular-nums text-ink">
                        {partita.azioni}
                      </td>
                      <td className="border-t border-line-strong/60 px-3 py-2 text-center text-sm font-semibold tabular-nums text-ok">
                        {partita.puntiFatti}
                      </td>
                      <td className="border-t border-line-strong/60 px-3 py-2 text-center text-sm font-semibold tabular-nums text-ko">
                        {partita.erroriFatti}
                      </td>
                      <td className="border-t border-line-strong/60 px-3 py-2 text-center text-sm font-semibold tabular-nums text-ink">
                        {partita.palloniAttaccati}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-panel-2">
                    <td
                      colSpan={4}
                      className="border-t-2 border-line-strong px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink"
                    >
                      Totale
                    </td>
                    <td className="border-t-2 border-line-strong px-3 py-3 text-center text-sm font-bold tabular-nums text-ink">
                      {statistiche.azioni}
                    </td>
                    <td className="border-t-2 border-line-strong px-3 py-3 text-center text-sm font-bold tabular-nums text-ok">
                      {statistiche.sintesi.puntiFatti}
                    </td>
                    <td className="border-t-2 border-line-strong px-3 py-3 text-center text-sm font-bold tabular-nums text-ko">
                      {statistiche.sintesi.erroriFatti}
                    </td>
                    <td className="border-t-2 border-line-strong px-3 py-3 text-center text-sm font-bold tabular-nums text-ink">
                      {statistiche.sintesi.palloniAttaccati}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      )}

      <GiocatoreForm
        key={giocatore.id}
        open={formOpen}
        giocatore={giocatore}
        onCancel={() => setFormOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
