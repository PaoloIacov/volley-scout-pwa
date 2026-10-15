import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  House,
  Monitor,
  Moon,
  Settings,
  Shirt,
  Sun,
  Users,
  Volleyball,
} from 'lucide-react';
import { useSettings } from './SettingsContext.jsx';
import { useSquadraAttiva } from '../hooks/useSquadre.js';
import { IconButton } from './ui.jsx';

const NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: House },
  { to: '/squadre', label: 'Squadre', icon: Shirt },
  { to: '/squadra', label: 'Rosa', icon: Users },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
  { to: '/scout', label: 'Scout', icon: ClipboardList },
  { to: '/impostazioni', label: 'Impostazioni', icon: Settings },
];

const TEME_CICLO = [
  { tema: 'scuro', icon: Moon, label: 'Tema scuro' },
  { tema: 'chiaro', icon: Sun, label: 'Tema chiaro' },
  { tema: 'sistema', icon: Monitor, label: 'Tema dal sistema' },
];

function navClasses(isActive) {
  return [
    'flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors duration-150 xl:px-3 xl:text-sm',
    isActive
      ? 'bg-accent/15 text-accent-text ring-1 ring-accent/25'
      : 'text-ink-soft hover:bg-panel-2 hover:text-ink',
  ].join(' ');
}

/** Bottone che cicla scuro → chiaro → sistema. */
function ThemeToggle({ tema, onChange }) {
  const index = Math.max(
    0,
    TEME_CICLO.findIndex((item) => item.tema === tema),
  );
  const current = TEME_CICLO[index];
  const next = TEME_CICLO[(index + 1) % TEME_CICLO.length];
  const Icon = current.icon;

  return (
    <IconButton
      label={`${current.label} — clicca per ${next.label.toLowerCase()}`}
      variant="outline"
      onClick={() => onChange(next.tema)}
    >
      <Icon size={17} />
    </IconButton>
  );
}

export default function Layout() {
  const { settings, update } = useSettings();
  const squadra = useSquadraAttiva();
  const { pathname } = useLocation();
  // La schermata di scouting (non l'elenco o il form) usa tutta la larghezza:
  // su desktop e tablet il rilievo dati ha bisogno di ogni pixel.
  const inScouting = /^\/scout\/(?!nuovo)/.test(pathname);
  const larghezza = inScouting ? 'max-w-none' : 'max-w-5xl';
  const titolo = squadra?.club || squadra?.nome || 'Volley Scout';
  const sottotitolo = squadra
    ? [squadra.nome !== titolo ? squadra.nome : null, squadra.stagione].filter(Boolean).join(' · ')
    : 'Crea la tua prima squadra';

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-panel/85 backdrop-blur-lg">
        <div
          className={`mx-auto flex h-16 w-full ${larghezza} items-center justify-between gap-3 px-4 sm:px-6`}
        >
          <NavLink to="/home" className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-on-accent shadow-lg shadow-accent/30">
              <Volleyball size={22} strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight text-ink sm:text-base">
                {titolo}
              </span>
              <span className="block truncate text-[11px] font-medium text-ink-mute">
                {sottotitolo}
              </span>
            </span>
          </NavLink>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => navClasses(isActive)}>
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </nav>

          <ThemeToggle tema={settings.tema} onChange={(tema) => update({ tema })} />
        </div>
      </header>

      <main
        className={`mx-auto w-full ${larghezza} flex-1 px-4 sm:px-6 ${
          inScouting ? 'pt-4 pb-6' : 'pt-6 pb-10'
        }`}
      >
        <Outlet />
      </main>

      {/* In scouting il footer sparisce: ogni pixel serve ai dati */}
      {!inScouting && (
        <footer className="hidden border-t border-line py-6 text-center text-xs text-ink-faint sm:block">
          Volley Scout{squadra ? ` · ${titolo}` : ''}
          {squadra?.stagione ? ` · Stagione ${squadra.stagione}` : ''}
        </footer>
      )}

      {/* Tab bar mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel/90 pb-safe backdrop-blur-lg lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-6 gap-1 px-2 py-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex w-full min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors duration-150',
                  isActive ? 'bg-accent/15 text-accent-text' : 'text-ink-mute hover:text-ink',
                ].join(' ')
              }
            >
              <Icon size={19} />
              <span className="w-full truncate text-center">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      {/* Spazio per la tab bar mobile */}
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </div>
  );
}
