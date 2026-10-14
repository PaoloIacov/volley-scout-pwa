import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ChevronRight,
  Clock,
  Dumbbell,
  MapPin,
  Trophy,
  Users,
} from 'lucide-react';
import { getGiocatori } from '../services/giocatori.js';
import { getPartite } from '../services/calendario.js';
import { parseDate, shortDate, todayISO } from '../lib/dates.js';
import { ALLENAMENTI, SEDE, SQUADRA, STAGIONE } from '../constants.js';
import { Badge, ButtonLink, Card } from '../components/ui.jsx';

export default function Home() {
  const giocatori = getGiocatori();
  const partite = getPartite();

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
    {
      label: 'Allenamenti a settimana',
      value: ALLENAMENTI.length,
      icon: Dumbbell,
      to: '/home',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="overflow-hidden p-0">
        <div className="relative">
          <img
            src="images/circo.JPG"
            alt={`${SQUADRA} ${STAGIONE}`}
            className="h-56 w-full object-cover object-center sm:h-72"
            loading="eager"
            width={1158}
            height={673}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 sm:p-6">
            <Badge className="w-fit bg-red-600 text-white shadow-lg shadow-red-950/50">
              Stagione {STAGIONE}
            </Badge>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {SQUADRA}
              </h1>
              <p className="mt-1 text-sm text-zinc-400">{SEDE.nome} · Albano Laziale</p>
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
            <Card className="flex items-center gap-4 p-4 transition-colors duration-150 group-hover:border-zinc-700 group-hover:bg-zinc-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600/15 text-red-400 ring-1 ring-red-500/25">
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-semibold leading-none text-white">{value}</p>
                <p className="mt-1.5 text-xs text-zinc-500">{label}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Allenamenti */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/15 text-red-400 ring-1 ring-red-500/25">
              <Dumbbell size={19} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Allenamenti</h2>
              <p className="text-xs text-zinc-500">Orari settimanali</p>
            </div>
          </div>
          <ul className="mt-4 divide-y divide-zinc-800/80">
            {ALLENAMENTI.map(({ giorno, orario }) => (
              <li key={giorno} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-zinc-200">{giorno}</span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-zinc-800/70 px-2.5 py-1 text-xs font-semibold text-zinc-300">
                  <Clock size={13} className="text-red-400" />
                  {orario}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Prossima partita */}
        <Card className="flex flex-col p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/15 text-red-400 ring-1 ring-red-500/25">
              <Trophy size={19} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Prossima partita</h2>
              <p className="text-xs text-zinc-500">Dal calendario</p>
            </div>
          </div>

          {prossima ? (
            <div className="mt-4 flex flex-1 flex-col justify-between gap-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-lg font-semibold text-white">vs {prossima.avversario}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={13} className="text-red-400" />
                    {shortDate(prossima.dataISO)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={13} className="text-red-400" />
                    {prossima.orarioInizio}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} className="text-red-400" />
                    {prossima.luogo}
                  </span>
                </div>
              </div>
              <Link to="/calendario" className="text-sm font-medium text-red-400 hover:text-red-300">
                Vedi tutto il calendario
                <ChevronRight size={14} className="inline" />
              </Link>
            </div>
          ) : (
            <div className="mt-4 flex flex-1 flex-col justify-between gap-4">
              <p className="text-sm text-zinc-500">Nessuna partita in calendario per ora.</p>
              <Link to="/calendario" className="text-sm font-medium text-red-400 hover:text-red-300">
                Aggiungi la prima partita
                <ChevronRight size={14} className="inline" />
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Sede */}
      <a href={SEDE.mapsUrl} target="_blank" rel="noreferrer" className="group block">
        <Card className="flex items-center gap-4 p-5 transition-colors duration-150 group-hover:border-zinc-700">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600/15 text-red-400 ring-1 ring-red-500/25">
            <MapPin size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Sede ufficiale</p>
            <p className="mt-0.5 truncate text-sm text-zinc-400">
              {SEDE.indirizzo} · {SEDE.soprannome}
            </p>
            <p className="mt-1 text-xs font-medium text-red-400">Apri in Google Maps</p>
          </div>
          <ChevronRight size={18} className="shrink-0 text-zinc-600 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-zinc-400" />
        </Card>
      </a>
    </div>
  );
}
