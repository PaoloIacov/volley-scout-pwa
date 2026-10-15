import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  Settings,
  Shirt,
  Trophy,
  Users,
  Volleyball,
} from 'lucide-react';
import { getGiocatori } from '../services/giocatori.js';
import { getPartite } from '../services/calendario.js';
import { fotoSquadra, getSquadre } from '../services/squadre.js';
import { useSquadraAttiva } from '../hooks/useSquadre.js';
import { parseDate, shortDate, todayISO } from '../lib/dates.js';
import { Badge, ButtonLink, Card, EmptyState, Section } from '../components/ui.jsx';

export default function Home() {
  const squadra = useSquadraAttiva();

  if (!squadra) {
    return (
      <EmptyState
        icon={Shirt}
        title="Nessuna squadra"
        description="Aggiungi una squadra per iniziare a gestire rosa dei giocatori e calendario partite."
        action={
          <ButtonLink to="/squadre" variant="primary">
            Gestisci le squadre
          </ButtonLink>
        }
      />
    );
  }

  const { club, stagione } = squadra;
  const copertina = fotoSquadra(squadra);
  const giocatori = getGiocatori(squadra.id);
  const partite = getPartite(squadra.id);
  const squadre = getSquadre();

  const todayTime = parseDate(todayISO()).getTime();
  const prossima = partite.find((p) => parseDate(p.dataISO).getTime() >= todayTime) ?? partite[0];

  const stats = [
    { label: 'Giocatori in rosa', value: giocatori.length, icon: Users, to: '/squadra' },
    {
      label: 'Partite in calendario',
      value: partite.length,
      icon: CalendarDays,
      to: '/calendario',
    },
    { label: 'Squadre', value: squadre.length, icon: Shirt, to: '/squadre' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="overflow-hidden p-0">
        <div className="relative">
          {copertina ? (
            <img
              src={copertina}
              alt={`${squadra.nome} ${stagione}`.trim()}
              className="h-56 w-full object-cover object-center sm:h-72"
              loading="eager"
              width={1158}
              height={673}
            />
          ) : (
            /* Nessuna foto caricata: motivo grafico generico. */
            <div className="flex h-56 w-full items-center justify-center bg-gradient-to-br from-accent via-accent-strong to-accent-hover sm:h-72">
              <Volleyball size={72} strokeWidth={1.5} className="text-on-accent/50" />
            </div>
          )}
          {/* Overlay scuro: leggibile sopra qualsiasi foto, in entrambi i temi. */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/5" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 sm:p-6">
            {stagione && (
              <Badge className="w-fit bg-accent text-on-accent shadow-lg shadow-black/40">
                Stagione {stagione}
              </Badge>
            )}
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {squadra.nome}
              </h1>
              {club && <p className="mt-1 text-sm text-zinc-300">{club}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <ButtonLink to="/squadra" variant="primary" size="sm">
                Vedi la rosa
                <ChevronRight size={15} />
              </ButtonLink>
              <ButtonLink to="/calendario" variant="outline" size="sm">
                Calendario
                <ChevronRight size={15} />
              </ButtonLink>
            </div>
          </div>
        </div>
      </Card>

      {/* Statistiche rapide */}
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to} className="group">
            <Card className="flex items-center gap-4 p-4 transition-colors duration-150 group-hover:border-line-strong group-hover:bg-panel-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent-text ring-1 ring-accent/25">
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-semibold leading-none text-ink">{value}</p>
                <p className="mt-1.5 text-xs text-ink-mute">{label}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Prossima partita */}
      <Section icon={Trophy} title="Prossima partita" subtitle="Dal calendario">
        {prossima ? (
          <div className="flex flex-1 flex-col justify-between gap-4">
            <div className="rounded-2xl border border-line bg-panel-2 p-4">
              <p className="text-lg font-semibold text-ink">vs {prossima.avversario}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={13} className="text-accent-text" />
                  {shortDate(prossima.dataISO)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} className="text-accent-text" />
                  {prossima.orarioInizio}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={13} className="text-accent-text" />
                  {prossima.luogo}
                </span>
              </div>
            </div>
            <Link
              to="/calendario"
              className="text-sm font-medium text-accent-text transition-colors hover:text-accent-hover"
            >
              Vedi tutto il calendario
              <ChevronRight size={14} className="inline" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-between gap-4">
            <p className="text-sm text-ink-mute">Nessuna partita in calendario per ora.</p>
            <Link
              to="/calendario"
              className="text-sm font-medium text-accent-text transition-colors hover:text-accent-hover"
            >
              Aggiungi la prima partita
              <ChevronRight size={14} className="inline" />
            </Link>
          </div>
        )}
      </Section>

      {/* Personalizza */}
      <Link to="/impostazioni" className="group block">
        <Card className="flex items-center gap-4 p-5 transition-colors duration-150 group-hover:border-line-strong">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent-text ring-1 ring-accent/25">
            <Settings size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Personalizza l'app</p>
            <p className="mt-0.5 truncate text-sm text-ink-soft">Tema, backup e ripristino dati</p>
            <p className="mt-1 text-xs font-medium text-accent-text">Apri le impostazioni</p>
          </div>
          <ChevronRight
            size={18}
            className="shrink-0 text-ink-faint transition-transform duration-150 group-hover:translate-x-1 group-hover:text-ink-mute"
          />
        </Card>
      </Link>
    </div>
  );
}
