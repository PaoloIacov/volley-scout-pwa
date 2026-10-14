import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';
import { ToastProvider } from '../components/Toast.jsx';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </MemoryRouter>
  );
}

function fill(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

beforeEach(() => localStorage.clear());

describe('navigazione', () => {
  it('mostra la homepage', () => {
    renderAt('/home');
    expect(screen.getByRole('heading', { name: 'Prima Divisione Maschile Blu' })).toBeInTheDocument();
    expect(screen.getByText('Allenamenti')).toBeInTheDocument();
  });

  it('mostra la pagina squadra vuota', () => {
    renderAt('/squadra');
    expect(screen.getByRole('heading', { name: 'Gestione giocatori' })).toBeInTheDocument();
    expect(screen.getByText('La rosa è vuota')).toBeInTheDocument();
  });

  it('mostra il calendario vuoto', () => {
    renderAt('/calendario');
    expect(screen.getByRole('heading', { name: 'Calendario partite' })).toBeInTheDocument();
    expect(screen.getByText('Nessuna partita in calendario')).toBeInTheDocument();
  });
});

describe('giocatori', () => {
  it('aggiunge un giocatore e lo salva in localStorage', async () => {
    renderAt('/squadra');
    fireEvent.click(screen.getByRole('button', { name: 'Nuovo' }));

    fill('Nome *', 'mario');
    fill('Cognome *', 'rossi');
    fill('Numero maglia *', '10');
    fireEvent.change(screen.getByLabelText('Ruolo *'), { target: { value: 'Palleggiatore' } });

    fireEvent.click(screen.getByRole('button', { name: 'Aggiungi' }));

    expect(await screen.findByText('Mario Rossi')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('giocatori'))).toEqual([
      { nome: 'mario', cognome: 'rossi', numeroMaglia: 10, ruolo: 'palleggiatore' },
    ]);
  });

  it('mostra gli errori di validazione su campi obbligatori', async () => {
    renderAt('/squadra');
    fireEvent.click(screen.getByRole('button', { name: 'Nuovo' }));

    fireEvent.change(screen.getByLabelText('Nome *'), { target: { value: 'm' } });
    fireEvent.blur(screen.getByLabelText('Nome *'));

    expect(await screen.findByText('Il nome deve avere almeno 2 caratteri')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aggiungi' })).toBeDisabled();
  });
});

describe('calendario', () => {
  it('aggiunge una partita e la ordina per data', async () => {
    renderAt('/calendario');

    fireEvent.click(screen.getByRole('button', { name: 'Nuova' }));
    fill('Data *', '2026-12-01');
    fill('Orario *', '18:00');
    fill('Avversario *', 'squadra beta');
    fill('Luogo *', 'palestra x');
    fireEvent.click(screen.getByRole('button', { name: 'Aggiungi' }));

    expect(await screen.findByText('vs Squadra Beta')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Nuova' }));
    fill('Data *', '2026-11-01');
    fill('Orario *', '20:00');
    fill('Avversario *', 'squadra alfa');
    fill('Luogo *', 'palestra y');
    fireEvent.click(screen.getByRole('button', { name: 'Aggiungi' }));

    expect(await screen.findByText('vs Squadra Alfa')).toBeInTheDocument();

    const rivals = screen.getAllByText(/^vs /).map((node) => node.textContent);
    expect(rivals).toEqual(['vs Squadra Alfa', 'vs Squadra Beta']);

    const saved = JSON.parse(localStorage.getItem('partite'));
    expect(saved.map((p) => p.data)).toEqual(['2026-11-01', '2026-12-01']);
  });
});
