import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getImpostazioni,
  resetImpostazioni,
  setImpostazioni,
} from '../services/impostazioni.js';

const SettingsContext = createContext(null);

const COLOR_SCHEME_DARK = '(prefers-color-scheme: dark)';

function prefersDark() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(COLOR_SCHEME_DARK).matches;
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => getImpostazioni());
  const [systemDark, setSystemDark] = useState(() => prefersDark());

  // Segue le preferenze di sistema anche mentre l'app è aperta.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia(COLOR_SCHEME_DARK);
    const onChange = (event) => setSystemDark(event.matches);
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);

  const dark =
    settings.tema === 'scuro' ? true : settings.tema === 'chiaro' ? false : systemDark;

  // Applica il tema al documento e all'UI del browser (barra PWA, date picker...).
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#09090b' : '#f4f4f5');
  }, [dark]);

  /** Aggiorna una parte delle impostazioni e le salva su localStorage. */
  const update = useCallback((partial) => {
    setSettings((current) => {
      const next = { ...current, ...partial };
      setImpostazioni(next);
      return next;
    });
  }, []);

  /** Sostituisce tutte le impostazioni (usato dall'import del backup). */
  const replace = useCallback((next) => {
    const normalized = setImpostazioni(next);
    setSettings(normalized);
    return normalized;
  }, []);

  const reset = useCallback(() => {
    const defaults = resetImpostazioni();
    setSettings(defaults);
    return defaults;
  }, []);

  const value = useMemo(
    () => ({ settings, dark, update, replace, reset }),
    [settings, dark, update, replace, reset]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings deve essere usato dentro <SettingsProvider>');
  return context;
}
