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
    </MemoryRouter>,
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
      {
        nome: 'mario',
        cognome: 'rossi',
        numeroMaglia: 10,
        ruolo: 'palleggiatore',
        squadraId: 's1',
      },
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
        {
          nome: 'mario',
          cognome: 'rossi',
          numeroMaglia: 10,
          ruolo: 'palleggiatore',
          squadraId: 's1',
        },
      ]),
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
        {
          nome: 'mario',
          cognome: 'rossi',
          numeroMaglia: 10,
          ruolo: 'palleggiatore',
          squadraId: 's1',
        },
      ]),
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
      ]),
    );
    localStorage.setItem(
      'scout',
      JSON.stringify([
        {
          id: 'sc1',
          squadraId: 's1',
          data: '2026-01-01',
          avversario: 'lazio',
          squadraOsservata: 'propria',
          setCorrente: 1,
          sets: [{ n: 1, nostro: 0, loro: 0 }],
          azioni: [],
          numeriExtra: [],
        },
      ]),
    );
    renderAt('/squadre');

    fireEvent.click(screen.getByRole('button', { name: 'Elimina' }));

    const dialog = screen.getByRole('dialog', { name: 'Elimina squadra' });
    expect(
      within(dialog).getByText(/1 giocatori, le 1 partite associate e i 1 scout/),
    ).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Elimina' }));

    expect(await screen.findByText('Nessuna squadra')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('squadre'))).toEqual([]);
    expect(JSON.parse(localStorage.getItem('giocatori'))).toEqual([]);
    expect(JSON.parse(localStorage.getItem('partite'))).toEqual([]);
    expect(JSON.parse(localStorage.getItem('scout'))).toEqual([]);
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
      }),
    );
    localStorage.setItem(
      'giocatori',
      JSON.stringify([
        { nome: 'mario', cognome: 'rossi', numeroMaglia: 10, ruolo: 'palleggiatore' },
      ]),
    );
    localStorage.setItem(
      'partite',
      JSON.stringify([
        { data: '2026-01-01', orarioInizio: '18:00', avversario: 'lazio', luogo: 'palestra x' },
      ]),
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
      JSON.stringify([{ nome: 'luca', cognome: 'neri', numeroMaglia: 5, ruolo: 'centrale' }]),
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

function seedScout(overrides = {}) {
  localStorage.setItem(
    'scout',
    JSON.stringify([
      {
        id: 'sc1',
        squadraId: 's1',
        data: '2026-12-01',
        orarioInizio: '18:00',
        avversario: 'Volley Beta',
        luogo: 'Palestra X',
        squadraOsservata: 'propria',
        setCorrente: 1,
        sets: [{ n: 1, nostro: 0, loro: 0 }],
        azioni: [],
        numeriExtra: [],
        aggiornato: 1,
        ...overrides,
      },
    ]),
  );
}

function seedRosa() {
  localStorage.setItem(
    'giocatori',
    JSON.stringify([
      {
        nome: 'mario',
        cognome: 'rossi',
        numeroMaglia: 10,
        ruolo: 'palleggiatore',
        squadraId: 's1',
      },
    ]),
  );
}

describe('scout', () => {
  it('crea un nuovo scout dalla home e apre la schermata di scouting', async () => {
    renderAt('/home');
    fireEvent.click(screen.getByRole('link', { name: /Nuovo scout/ }));

    const dialog = screen.getByRole('dialog', { name: 'Nuovo scout' });
    expect(within(dialog).getByLabelText('Data *').value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    fill('Avversario *', 'Volley Team');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Inizia lo scout' }));

    expect(await screen.findByRole('heading', { name: /vs Volley Team/ })).toBeInTheDocument();
    const scout = JSON.parse(localStorage.getItem('scout'));
    expect(scout).toHaveLength(1);
    expect(scout[0]).toMatchObject({
      squadraId: 's1',
      avversario: 'Volley Team',
      squadraOsservata: 'propria',
      setCorrente: 1,
    });
    expect(scout[0].sets).toEqual([{ n: 1, nostro: 0, loro: 0 }]);
  });

  it('precompila il form arrivando dal pulsante del calendario', async () => {
    localStorage.setItem(
      'partite',
      JSON.stringify([
        {
          data: '2026-12-01',
          orarioInizio: '18:00',
          avversario: 'volley beta',
          luogo: 'palestra x',
          squadraId: 's1',
        },
      ]),
    );
    renderAt('/calendario');
    fireEvent.click(screen.getByRole('link', { name: 'Scout contro Volley Beta' }));

    const dialog = screen.getByRole('dialog', { name: 'Nuovo scout' });
    expect(within(dialog).getByLabelText('Data *')).toHaveValue('2026-12-01');
    expect(within(dialog).getByLabelText('Orario')).toHaveValue('18:00');
    expect(within(dialog).getByLabelText('Avversario *')).toHaveValue('Volley Beta');
    expect(within(dialog).getByLabelText('Luogo')).toHaveValue('Palestra X');

    // Si può scegliere di scoutizzare la squadra avversaria.
    fireEvent.click(within(dialog).getByRole('radio', { name: 'Volley Beta' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Inizia lo scout' }));

    expect(await screen.findByRole('heading', { name: /vs Volley Beta/ })).toBeInTheDocument();
    const scout = JSON.parse(localStorage.getItem('scout'));
    expect(scout[0].squadraOsservata).toBe('avversaria');
    expect(scout[0]).toMatchObject({ data: '2026-12-01', luogo: 'Palestra X' });
  });

  it('registra un dato con giocatore, azione ed esito e lo salva subito', () => {
    seedScout();
    seedRosa();
    renderAt('/scout/sc1');

    fireEvent.click(screen.getByRole('button', { name: 'Giocatore 10' }));
    fireEvent.click(screen.getByRole('button', { name: 'Attacco' }));
    fireEvent.click(screen.getByRole('button', { name: 'Esito errore' }));

    const scout = JSON.parse(localStorage.getItem('scout'))[0];
    expect(scout.azioni).toHaveLength(1);
    expect(scout.azioni[0]).toMatchObject({
      numero: 10,
      azione: 'attacco',
      esito: '=',
      set: 1,
    });
    expect(screen.getByText('1 azione')).toBeInTheDocument();

    // Annulla ultimo: il dato sparisce anche dallo storage.
    fireEvent.click(screen.getByRole('button', { name: 'Annulla ultimo' }));
    expect(JSON.parse(localStorage.getItem('scout'))[0].azioni).toHaveLength(0);
  });

  it('modifica il punteggio con i tasti +/- e scrivendo il numero', () => {
    seedScout();
    renderAt('/scout/sc1');

    fireEvent.click(screen.getByRole('button', { name: 'Aggiungi punto a Noi' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aggiungi punto a Noi' }));
    expect(screen.getByLabelText('Punteggio nostro')).toHaveValue(2);

    fireEvent.click(screen.getByRole('button', { name: 'Togli punto a Noi' }));
    expect(screen.getByLabelText('Punteggio nostro')).toHaveValue(1);

    fireEvent.change(screen.getByLabelText('Punteggio nostro'), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText('Punteggio avversario'), {
      target: { value: '23' },
    });
    const sets = JSON.parse(localStorage.getItem('scout'))[0].sets;
    expect(sets[0]).toEqual({ n: 1, nostro: 25, loro: 23 });
  });

  it('gestisce i set: aggiunta e selezione', () => {
    seedScout();
    renderAt('/scout/sc1');

    fireEvent.click(screen.getByRole('button', { name: 'Aggiungi set' }));
    const scout = JSON.parse(localStorage.getItem('scout'))[0];
    expect(scout.sets).toHaveLength(2);
    expect(scout.setCorrente).toBe(2);
    expect(screen.getByLabelText('Set 2')).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Set 1' }));
    expect(JSON.parse(localStorage.getItem('scout'))[0].setCorrente).toBe(1);
  });

  it('mostra il riepilogo per giocatore nella tab dedicata', () => {
    seedScout({
      azioni: [
        { id: 'a1', ts: 1, set: 1, numero: 10, azione: 'attacco', esito: '=' },
        { id: 'a2', ts: 2, set: 1, numero: 10, azione: 'attacco', esito: '#' },
        { id: 'a3', ts: 3, set: 1, numero: 10, azione: 'muro', esito: '+' },
      ],
    });
    seedRosa();
    renderAt('/scout/sc1');

    fireEvent.click(screen.getByRole('radio', { name: 'Riepilogo' }));

    const table = screen.getByRole('table');
    const riga = within(table)
      .getAllByRole('row')
      .find((row) => within(row).queryByText('Mario Rossi'));
    expect(riga).toBeDefined();
    expect(within(riga).getByText('2')).toBeInTheDocument(); // attacchi
    expect(within(riga).getByText('1')).toBeInTheDocument(); // muri
    expect(within(riga).getByText('3')).toBeInTheDocument(); // totale riga
    expect(screen.getByText('Legenda:')).toBeInTheDocument();
  });

  it('esce e rientra dalla schermata senza perdere i dati', () => {
    seedScout();
    seedRosa();
    const { unmount } = renderAt('/scout/sc1');

    fireEvent.click(screen.getByRole('button', { name: 'Giocatore 10' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ricezione' }));
    fireEvent.click(screen.getByRole('button', { name: 'Esito positiva' }));
    unmount();

    renderAt('/scout/sc1');
    expect(screen.getByText('1 azione')).toBeInTheDocument();
    expect(screen.getAllByText('N. 10').length).toBeGreaterThan(0);
    expect(JSON.parse(localStorage.getItem('scout'))[0].azioni).toHaveLength(1);
  });

  it('elenca gli scout e consente di eliminarli con conferma', async () => {
    seedScout();
    renderAt('/scout');

    expect(screen.getByRole('heading', { name: 'Scout' })).toBeInTheDocument();
    expect(screen.getByText('vs Volley Beta')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Elimina' }));
    const dialog = screen.getByRole('dialog', { name: 'Elimina scout' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Elimina' }));

    expect(await screen.findByText('Nessuno scout ancora')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('scout'))).toEqual([]);
  });
});
