import { useState } from 'react';

/**
 * Stub di `virtual:pwa-register/react` per i test: vite-plugin-pwa non gira in
 * vitest, quindi il modulo virtuale viene ripuntato qui dall'alias in
 * vitest.config.js. Nessun service worker, nessun aggiornamento da reportare.
 * Come l'hook reale, `needRefresh` e `offlineReady` sono tuple [valore, setter].
 */
export function useRegisterSW() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const updateServiceWorker = () => {};
  return {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  };
}
