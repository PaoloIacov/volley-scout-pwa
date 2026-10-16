import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import AggiornaApp from '../components/AggiornaApp.jsx';
import { ToastProvider } from '../components/Toast.jsx';

/** Stato condiviso col mock del registro PWA: simula ciò che reporta il browser. */
const pwa = vi.hoisted(() => ({
  nuovaVersione: false,
  prontoOffline: false,
  updateServiceWorker: vi.fn(),
}));

// Il modulo virtuale del plugin PWA è un no-op nei test: lo sostituiamo con uno
// stato pilotabile, come farebbe il service worker in produzione.
vi.mock('virtual:pwa-register/react', async () => {
  const { useState } = await import('react');
  return {
    useRegisterSW: () => {
      const [nuovaVersione, setNuovaVersione] = useState(pwa.nuovaVersione);
      const [prontoOffline, setProntoOffline] = useState(pwa.prontoOffline);
      return {
        needRefresh: [nuovaVersione, setNuovaVersione],
        offlineReady: [prontoOffline, setProntoOffline],
        updateServiceWorker: pwa.updateServiceWorker,
      };
    },
  };
});

function renderBanner() {
  return render(
    <ToastProvider>
      <AggiornaApp />
    </ToastProvider>,
  );
}

beforeEach(() => {
  pwa.nuovaVersione = false;
  pwa.prontoOffline = false;
  pwa.updateServiceWorker.mockClear();
});

describe('aggiornamento app', () => {
  it('resta silenzioso quando non ci sono nuove versioni', () => {
    renderBanner();
    expect(screen.queryByText('Nuova versione disponibile')).not.toBeInTheDocument();
  });

  it('invita ad aggiornare e attiva il service worker in attesa', () => {
    pwa.nuovaVersione = true;
    renderBanner();

    fireEvent.click(screen.getByRole('button', { name: 'Aggiorna' }));

    expect(pwa.updateServiceWorker).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: /Aggiornamento/ })).toBeDisabled();
  });

  it('nasconde il banner con Più tardi, senza aggiornare', () => {
    pwa.nuovaVersione = true;
    renderBanner();

    fireEvent.click(screen.getByRole('button', { name: 'Più tardi' }));

    expect(screen.queryByText('Nuova versione disponibile')).not.toBeInTheDocument();
    expect(pwa.updateServiceWorker).not.toHaveBeenCalled();
  });

  it("annuncia che l'app è pronta per l'uso offline", async () => {
    pwa.prontoOffline = true;
    renderBanner();

    expect(
      await screen.findByText("Volley Scout è pronto per l'uso offline."),
    ).toBeInTheDocument();
  });
});
