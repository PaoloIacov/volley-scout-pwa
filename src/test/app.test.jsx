import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';
import { SettingsProvider } from '../components/SettingsContext.jsx';
import { ToastProvider } from '../components/Toast.jsx';
import { migraDati } from '../services/squadre.js';

const SQUADRA = {
  id: 's1',
  nome: 'Prima Divisione Maschile Blu',
  club: '1DM Albano Circo',
  stagione: '2025/2026',
  foto: '',
  fotoUrl: '',
};

const SQUADRA_2 = { id: 's2', nome: 'Under 20', club: '', stagione: '', foto: '', fotoUrl: '' };

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SettingsProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </SettingsProvider>
    </MemoryRouter>
  );
}

function fill(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function seedSquadra(squadra = SQUADRA) {
  localStorage.setItem('squadre', JSON.stringify([squadra]));
  localStorage.setItem('squadraAttiva', JSON.stringify(squadra.id));
  localStorage.setItem('impostazioni', JSON.stringify({ tema: 'sistema' }));
}

beforeEach(() => {
  localStorage.clear();
  seedSquadra();
});

describe('navigazione', () => {
  it('mostra la homepage con la squadra attiva', () => {
    renderAt('/home');
    expect(screen.getByRole('heading', { name: SQUADRA.nome })).toBeInTheDocument();
    expect(screen.getByText('Stagione 2025/2026')).toBeInTheDocument();
    expect(screen.getByText('Giocatori in rosa')).toBeInTheDocument();
    expect(screen.getByText('Partite in calendario')).toBeInTheDocument();
  });

  it('non mostra più allenamenti né sede', () => {
    renderAt('/home');
    expect(screen.queryByText('Allenamenti')).not.toBeInTheDocument();
    expect(screen.queryByText('Sede ufficiale')).not.toBeInTheDocument();
  });

  it('mostra la pagina rosa vuota', () => {
    renderAt('/squadra');
    expect(screen.getByRole('heading', { name: 'Gestione giocatori' })).toBeInTheDocument();
    expect(screen.getByText('La rosa è vuota')).toBeInTheDocument();
    expect(screen.getByText(/in rosa · Prima Divisione Maschile Blu/)).toBeInTheDocument();
  });

  it('mostra il calendario vuoto', () => {
    renderAt('/calendario');
    expect(screen.getByRole('heading', { name: 'Calendario partite' })).toBeInTheDocument();
    expect(screen.getByText('Nessuna partita in calendario')).toBeInTheDocument();
  });

  it('mostra la pagina gestione squadre', () => {
    renderAt('/squadre');
    expect(screen.getByRole('heading', { name: 'Gestione squadre' })).toBeInTheDocument();
    expect(screen.getByText(/1 squadra registrata/)).toBeInTheDocument();
    expect(screen.getByText('Attiva')).toBeInTheDocument();
  });

  it('invita a creare una squadra quando non ce ne sono', () => {
    localStorage.clear();
    renderAt('/home');
    expect(screen.getByText('Nessuna squadra')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Gestisci le squadre/ })).toBeInTheDocument();
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
      { nome: 'mario', cognome: 'rossi', numeroMaglia: 10, ruolo: 'palleggiatore', squadraId: 's1' },
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

  it('isola la rosa della squadra attiva', () => {
    localStorage.setItem(
      'giocatori',
      JSON.stringify([
        { nome: 'mario', cognome: 'rossi', numeroMaglia: 10, ruolo: 'palleggiatore', squadraId: 's1' },
      ])
    );
    localStorage.setItem('squadre', JSON.stringify([SQUADRA, SQUADRA_2]));
    localStorage.setItem('squadraAttiva', JSON.stringify('s2'));

    renderAt('/squadra');
    expect(screen.getByText('La rosa è vuota')).toBeInTheDocument();
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
    expect(saved.every((p) => p.squadraId === 's1')).toBe(true);
  });
});

describe('squadre', () => {
  it('aggiunge una nuova squadra', async () => {
    renderAt('/squadre');
    fireEvent.click(screen.getByRole('button', { name: 'Nuova' }));

    fill('Nome *', 'Under 20');
    fill('Stagione', '2026/2027');
    fireEvent.click(screen.getByRole('button', { name: 'Aggiungi' }));

    expect(await screen.findByText('Under 20')).toBeInTheDocument();

    const squadre = JSON.parse(localStorage.getItem('squadre'));
    expect(squadre).toHaveLength(2);
    expect(squadre[1]).toMatchObject({ nome: 'Under 20', stagione: '2026/2027' });
  });

  it('valida il nome obbligatorio', async () => {
    renderAt('/squadre');
    fireEvent.click(screen.getByRole('button', { name: 'Nuova' }));

    fireEvent.change(screen.getByLabelText('Nome *'), { target: { value: 'u' } });
    fireEvent.blur(screen.getByLabelText('Nome *'));

    expect(await screen.findByText('Il nome deve avere almeno 2 caratteri')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aggiungi' })).toBeDisabled();
  });

  it("rende attiva un'altra squadra", async () => {
    localStorage.setItem('squadre', JSON.stringify([SQUADRA, SQUADRA_2]));
    renderAt('/squadre');

    fireEvent.click(screen.getByRole('button', { name: 'Rendi attiva' }));

    expect(await screen.findByText(/attiva: Under 20/)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('squadraAttiva'))).toBe('s2');
  });

  it('elimina squadra e dati associati con conferma', async () => {
    localStorage.setItem(
      'giocatori',
      JSON.stringify([
        { nome: 'mario', cognome: 'rossi', numeroMaglia: 10, ruolo: 'palleggiatore', squadraId: 's1' },
      ])
    );
    localStorage.setItem(
      'partite',
      JSON.stringify([
        {
          data: '2026-01-01',
          orarioInizio: '18:00',
          avversario: 'lazio',
          luogo: 'palestra x',
          squadraId: 's1',
        },
      ])
    );
    renderAt('/squadre');

    fireEvent.click(screen.getByRole('button', { name: 'Elimina' }));

    const dialog = screen.getByRole('dialog', { name: 'Elimina squadra' });
    expect(within(dialog).getByText(/1 giocatori e le 1 partite/)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Elimina' }));

    expect(await screen.findByText('Nessuna squadra')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('squadre'))).toEqual([]);
    expect(JSON.parse(localStorage.getItem('giocatori'))).toEqual([]);
    expect(JSON.parse(localStorage.getItem('partite'))).toEqual([]);
  });
});

describe('migrazione dati preesistenti', () => {
  it("crea la prima squadra dall'identità delle vecchie impostazioni", () => {
    localStorage.clear();
    localStorage.setItem(
      'impostazioni',
      JSON.stringify({
        club: '1DM Albano Circo',
        squadra: 'Prima Divisione Maschile Blu',
        stagione: '2025/2026',
        citta: 'Albano Laziale',
        sede: { nome: 'Palestra Collodi' },
        allenamenti: [{ giorno: 'Lunedì', orario: '21:00 - 22:45', luogo: 'Palestra Collodi' }],
        tema: 'scuro',
      })
    );
    localStorage.setItem(
      'giocatori',
      JSON.stringify([{ nome: 'mario', cognome: 'rossi', numeroMaglia: 10, ruolo: 'palleggiatore' }])
    );
    localStorage.setItem(
      'partite',
      JSON.stringify([
        { data: '2026-01-01', orarioInizio: '18:00', avversario: 'lazio', luogo: 'palestra x' },
      ])
    );

    migraDati();

    const squadre = JSON.parse(localStorage.getItem('squadre'));
    expect(squadre).toHaveLength(1);
    expect(squadre[0]).toMatchObject({
      nome: 'Prima Divisione Maschile Blu',
      club: '1DM Albano Circo',
      stagione: '2025/2026',
    });
    expect(JSON.parse(localStorage.getItem('squadraAttiva'))).toBe(squadre[0].id);

    const id = squadre[0].id;
    expect(JSON.parse(localStorage.getItem('giocatori'))[0].squadraId).toBe(id);
    expect(JSON.parse(localStorage.getItem('partite'))[0].squadraId).toBe(id);

    // nelle impostazioni resta solo il tema
    expect(JSON.parse(localStorage.getItem('impostazioni'))).toEqual({ tema: 'scuro' });

    renderAt('/squadra');
    expect(screen.getByText('Mario Rossi')).toBeInTheDocument();
  });

  it('adotta i dati preesistenti quando si crea la prima squadra', async () => {
    localStorage.clear();
    localStorage.setItem(
      'giocatori',
      JSON.stringify([{ nome: 'luca', cognome: 'neri', numeroMaglia: 5, ruolo: 'centrale' }])
    );

    renderAt('/squadre');
    fireEvent.click(screen.getByRole('button', { name: 'Nuova' }));
    fill('Nome *', 'Senior');
    fireEvent.click(screen.getByRole('button', { name: 'Aggiungi' }));

    expect(await screen.findByText(/attiva: Senior/)).toBeInTheDocument();
    const squadre = JSON.parse(localStorage.getItem('squadre'));
    expect(squadre).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('giocatori'))[0].squadraId).toBe(squadre[0].id);
  });
});
