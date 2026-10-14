import { NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, House, Users, Volleyball } from 'lucide-react';
import { CLUB, SQUADRA, STAGIONE } from '../constants.js';

const NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: House },
  { to: '/squadra', label: 'Squadra', icon: Users },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
];

function navClasses(isActive) {
  return [
    'flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors duration-150',
    isActive ? 'bg-red-600/15 text-red-400 ring-1 ring-red-500/25' : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100',
  ].join(' ');
}

export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <NavLink to="/home" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-950/50">
              <Volleyball size={22} strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight text-white sm:text-base">
                {CLUB}
              </span>
              <span className="block truncate text-[11px] font-medium text-zinc-500">
                {SQUADRA} · {STAGIONE}
              </span>
            </span>
          </NavLink>

          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => navClasses(isActive)}>
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-10 sm:px-6">
        <Outlet />
      </main>

      <footer className="hidden border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-600 sm:block">
        Volley Scout · {CLUB} · Stagione {STAGIONE}
      </footer>

      {/* Tab bar mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800/80 bg-zinc-950/90 pb-safe backdrop-blur-lg sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-1 px-3 py-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-red-600/15 text-red-400'
                    : 'text-zinc-500 hover:text-zinc-300',
                ].join(' ')
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
      {/* Spazio per la tab bar mobile */}
      <div className="h-20 sm:hidden" aria-hidden="true" />
    </div>
  );
}
