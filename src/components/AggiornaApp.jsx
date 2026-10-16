import { RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToast } from './Toast.jsx';
import { Button } from './ui.jsx';

/** Controllo periodico: ogni ora, più quando la finestra torna in primo piano. */
const INTERVALLO_CONTROLLO_MS = 60 * 60 * 1000;

/**
 * Rileva le nuove versioni dell'app: quando il service worker aggiornato è in
 * attesa, invita l'utente ad aggiornare con un pulsante. Con registerType
 * 'prompt' il vecchio service worker resta attivo finché l'utente non accetta,
 * così una scrimata in corso non viene mai interrotta da un ricaricamento.
 *
 * I controlli periodici servono perché con HashRouter le navigazioni interne
 * non ricaricano la pagina e il browser non verificherebbe da solo la presenza
 * di aggiornamenti durante sessioni lunghe.
 */
export default function AggiornaApp() {
  const toast = useToast();
  const registrazioneRef = useRef(null);
  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_swUrl, registrazione) {
      registrazioneRef.current = registrazione ?? null;
    },
  });
  const [nuovaVersione, setNuovaVersione] = needRefresh;
  const [prontoOffline, setProntoOffline] = offlineReady;
  const [aggiornamentoInCorso, setAggiornamentoInCorso] = useState(false);

  useEffect(() => {
    if (!prontoOffline) return undefined;
    toast.show("Volley Scout è pronto per l'uso offline.", 'info');
    setProntoOffline(false);
    return undefined;
  }, [prontoOffline, setProntoOffline, toast]);

  useEffect(() => {
    const controllaAggiornamenti = () => {
      registrazioneRef.current?.update().catch(() => {});
    };
    const intervallo = setInterval(controllaAggiornamenti, INTERVALLO_CONTROLLO_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') controllaAggiornamenti();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(intervallo);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  if (!nuovaVersione) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[70] lg:inset-x-auto lg:right-4 lg:bottom-4 lg:w-96"
    >
      <div className="anim-pop pointer-events-auto flex flex-col gap-3 rounded-2xl border border-accent/45 bg-panel/95 p-4 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-text ring-1 ring-accent/25">
            <RefreshCw size={17} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Nuova versione disponibile</p>
            <p className="mt-0.5 text-xs text-ink-mute">
              Aggiorna Volley Scout per avere subito le ultime funzioni.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setNuovaVersione(false)}>
            Più tardi
          </Button>
          <Button
            size="sm"
            disabled={aggiornamentoInCorso}
            onClick={() => {
              setAggiornamentoInCorso(true);
              // Attiva subito il service worker in attesa e ricarica la pagina.
              updateServiceWorker(true);
            }}
          >
            <RefreshCw
              size={14}
              aria-hidden="true"
              className={aggiornamentoInCorso ? 'animate-spin' : ''}
            />
            {aggiornamentoInCorso ? 'Aggiornamento…' : 'Aggiorna'}
          </Button>
        </div>
      </div>
    </div>
  );
}
