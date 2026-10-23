import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { Card } from '../ui.jsx';
import {
  AZIONI,
  ESITI,
  ESITO_CLASSI,
  costruisciRiepilogo,
  sintesiCelle,
} from '../../lib/scout-stats.js';

/** Cella di un esito: badge colorato, punto quando il valore è zero. */
function CellaEsito({ valore, esito, primo }) {
  const bordo = primo ? 'border-l-2 border-line-strong ' : '';
  return (
    <td className={`${bordo}border-t border-line-strong/60 p-1 text-center align-middle`}>
      <span className="flex h-9 min-w-9 items-center justify-center">
        {valore ? (
          <span
            className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-xs font-bold tabular-nums ring-1 ${ESITO_CLASSI[esito].tondo}`}
          >
            {valore}
          </span>
        ) : (
          <span className="text-base leading-none text-ink-faint">·</span>
        )}
      </span>
    </td>
  );
}

/** Cella delle tre sintesi: punti fatti, errori fatti, palloni attaccati. */
function CellaSintesi({ valore, tono, primo }) {
  const colore = valore > 0 ? tono : 'text-ink-faint';
  return (
    <td
      className={`${
        primo ? 'border-l-2 border-line-strong ' : ''
      }border-t border-line-strong/60 p-1 text-center align-middle`}
    >
      <span
        className={`inline-flex h-9 min-w-9 items-center justify-center text-sm font-bold tabular-nums ${colore}`}
      >
        {valore}
      </span>
    </td>
  );
}

/** Numero di maglia e nome del giocatore, come nella tabella del riepilogo. */
function CellaGiocatore({ riga }) {
  return (
    <td className="border-t border-line-strong/70 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-panel-2 text-sm font-bold text-ink ring-1 ring-line-strong tabular-nums">
          {riga.numero}
        </span>
        {riga.nome && (
          <span className="min-w-0 truncate text-sm font-medium text-ink">{riga.nome}</span>
        )}
      </div>
    </td>
  );
}

/**
 * Tab Totali: tutti i convocati con la stessa suddivisione del riepilogo
 * (Ricezione / Attacco / Muro / Battuta, ognuna con i 4 esiti), più tre
 * colonne di sintesi: punti fatti, errori fatti e palloni attaccati.
 *
 * Il selettore in alto permette di passare dai totali dell'intera partita a
 * quelli del singolo set; la tabella in basso mostra sempre, per ogni
 * giocatore, il numero di azioni set per set e il totale partita.
 */
export default function Totali({ scout, giocatori = [] }) {
  const partita = costruisciRiepilogo(scout, giocatori);
  const perSet = new Map(
    scout.sets.map((set) => [set.n, costruisciRiepilogo(scout, giocatori, set.n)]),
  );
  const [vista, setVista] = useState('partita');

  const opzioni = [
    { value: 'partita', label: 'Partita' },
    ...scout.sets.map((set) => ({ value: String(set.n), label: `Set ${set.n}` })),
  ];
  // Se il set selezionato viene eliminato, si torna ai totali della partita.
  const vistaValida = vista === 'partita' || perSet.has(Number(vista));
  const vistaCorrente = vistaValida ? vista : 'partita';
  const datiVista = vistaCorrente === 'partita' ? partita : perSet.get(Number(vistaCorrente));
  const etichettaVista = vistaCorrente === 'partita' ? 'partita' : `set ${vistaCorrente}`;
  const sintesiSquadra = sintesiCelle(datiVista.totali);

  const totaleVista = ESITI.reduce(
    (somma, esito) => somma + datiVista.totaliPerEsito[esito.id],
    0,
  );
  const totalePartita = ESITI.reduce(
    (somma, esito) => somma + partita.totaliPerEsito[esito.id],
    0,
  );
  const totaliPerSet = new Map(
    scout.sets.map((set) => [
      set.n,
      ESITI.reduce((somma, esito) => somma + perSet.get(set.n).totaliPerEsito[esito.id], 0),
    ]),
  );

  if (partita.righe.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-panel-2 text-ink-soft ring-1 ring-line">
          <ClipboardList size={26} />
        </div>
        <p className="font-medium text-ink">Nessun totale disponibile</p>
        <p className="max-w-sm text-sm text-ink-mute">
          Registra qualche azione dalla tab Inserimento o dal Riepilogo: qui troverai i totali
          di tutti i convocati, per set e per l&apos;intera partita.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-2 border-b border-line bg-panel-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Totali</p>
            <p className="text-xs text-ink-mute">
              Tutti i convocati · azioni e sintesi{' '}
              {vistaCorrente === 'partita' ? 'della partita' : `del set ${vistaCorrente}`}
            </p>
          </div>
          <div
            role="radiogroup"
            aria-label="Vista totali"
            className="flex gap-1 overflow-x-auto pb-0.5"
          >
            {opzioni.map((opzione) => {
              const attiva = opzione.value === vistaCorrente;
              return (
                <button
                  key={opzione.value}
                  type="button"
                  role="radio"
                  aria-checked={attiva}
                  onClick={() => setVista(opzione.value)}
                  className={`h-8 shrink-0 cursor-pointer whitespace-nowrap rounded-lg px-2.5 text-xs font-semibold transition-colors duration-150 ${
                    attiva
                      ? 'bg-accent text-on-accent shadow-sm'
                      : 'text-ink-soft hover:bg-panel hover:text-ink'
                  }`}
                >
                  {opzione.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-h-[calc(100dvh-13rem)] overflow-auto">
          <table
            aria-label={`Totali ${etichettaVista}`}
            className="w-full min-w-[1080px] border-separate border-spacing-0 text-left"
          >
            <thead className="sticky top-0 z-10">
              <tr className="bg-panel-2 text-[11px] font-semibold uppercase tracking-wider">
                <th
                  scope="col"
                  rowSpan={2}
                  className="border-b border-line-strong bg-panel-2 px-4 py-3 text-left align-bottom text-ink"
                >
                  Giocatore
                </th>
                {AZIONI.map((azione) => (
                  <th
                    key={azione.id}
                    scope="colgroup"
                    colSpan={ESITI.length}
                    className="border-b border-l-2 border-line-strong bg-panel-2 px-2 pb-1.5 pt-3 text-center font-bold text-ink"
                  >
                    {azione.label}
                  </th>
                ))}
                <th
                  scope="colgroup"
                  colSpan={3}
                  className="border-b border-l-2 border-line-strong bg-panel-2 px-2 pb-1.5 pt-3 text-center font-bold text-ink"
                >
                  Sintesi
                </th>
              </tr>
              <tr className="bg-panel-2 text-ink-soft">
                {AZIONI.map((azione) =>
                  ESITI.map((esito, i) => (
                    <th
                      key={`${azione.id}-${esito.id}`}
                      scope="col"
                      className={`border-b border-line-strong bg-panel-2 pb-2.5 text-center ${
                        i === 0 ? 'border-l-2 border-line-strong' : ''
                      }`}
                    >
                      <span
                        className={`inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-[11px] font-bold ${ESITO_CLASSI[esito.id].tondo}`}
                      >
                        {esito.id}
                      </span>
                    </th>
                  )),
                )}
                <th
                  scope="col"
                  className="border-b border-l-2 border-line-strong bg-panel-2 px-2 py-2 text-center align-bottom text-[10px] font-bold leading-tight text-ink"
                >
                  Punti fatti
                </th>
                <th
                  scope="col"
                  className="border-b border-line-strong bg-panel-2 px-2 py-2 text-center align-bottom text-[10px] font-bold leading-tight text-ink"
                >
                  Errori fatti
                </th>
                <th
                  scope="col"
                  className="border-b border-line-strong bg-panel-2 px-2 py-2 text-center align-bottom text-[10px] font-bold leading-tight text-ink"
                >
                  Palloni attaccati
                </th>
              </tr>
            </thead>
            <tbody>
              {partita.righe.map((riga) => {
                const rigaVista =
                  vistaCorrente === 'partita'
                    ? riga
                    : perSet
                        .get(Number(vistaCorrente))
                        .righe.find((voce) => voce.numero === riga.numero);
                const celle = rigaVista?.celle;
                const sintesi = sintesiCelle(celle);
                return (
                  <tr
                    key={riga.numero}
                    className="transition-colors even:bg-panel-2/65 hover:bg-accent/5"
                  >
                    <CellaGiocatore riga={riga} />
                    {AZIONI.map((azione) =>
                      ESITI.map((esito, i) => (
                        <CellaEsito
                          key={`${azione.id}-${esito.id}`}
                          valore={celle?.[azione.id]?.[esito.id] ?? 0}
                          esito={esito.id}
                          primo={i === 0}
                        />
                      )),
                    )}
                    <CellaSintesi valore={sintesi.puntiFatti} tono="text-ok" primo />
                    <CellaSintesi valore={sintesi.erroriFatti} tono="text-ko" />
                    <CellaSintesi valore={sintesi.palloniAttaccati} tono="text-ink" />
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-panel-2">
                <td className="border-t-2 border-line-strong px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink">
                  Totale squadra
                  <span className="block text-[10px] font-normal normal-case tracking-normal text-ink-mute">
                    {totaleVista} azioni
                  </span>
                </td>
                {AZIONI.map((azione) =>
                  ESITI.map((esito, i) => (
                    <CellaEsito
                      key={`${azione.id}-${esito.id}`}
                      valore={datiVista.totali[azione.id][esito.id]}
                      esito={esito.id}
                      primo={i === 0}
                    />
                  )),
                )}
                <CellaSintesi valore={sintesiSquadra.puntiFatti} tono="text-ok" primo />
                <CellaSintesi valore={sintesiSquadra.erroriFatti} tono="text-ko" />
                <CellaSintesi valore={sintesiSquadra.palloniAttaccati} tono="text-ink" />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line px-4 py-3 text-xs text-ink-mute">
          <span className="font-semibold uppercase tracking-wider">Legenda:</span>
          {ESITI.map((esito) => (
            <span key={esito.id} className="inline-flex items-center gap-1.5">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold ring-1 ${ESITO_CLASSI[esito.id].tondo}`}
              >
                {esito.id}
              </span>
              {esito.breve}
            </span>
          ))}
        </div>
        <div className="border-t border-line px-4 py-2 text-[11px] text-ink-mute">
          <span className="font-semibold text-ink">Punti fatti</span>: # in attacco, muro e
          battuta · <span className="font-semibold text-ink">Errori fatti</span>: = in tutte le
          azioni · <span className="font-semibold text-ink">Palloni attaccati</span>: tutte le
          azioni di attacco.
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-line bg-panel-2 px-3 py-2">
          <p className="text-sm font-semibold text-ink">Totali per set</p>
          <p className="text-xs text-ink-mute">
            Numero di azioni di ogni convocato, set per set, più il totale della partita. Per
            Punti / Errori / Palloni attaccati usa il selettore in alto.
          </p>
        </div>
        <div className="overflow-auto">
          <table
            aria-label="Totali per set"
            className="w-full min-w-[420px] border-separate border-spacing-0 text-left"
          >
            <thead>
              <tr className="bg-panel-2 text-[11px] font-semibold uppercase tracking-wider">
                <th
                  scope="col"
                  className="border-b border-line-strong bg-panel-2 px-4 py-3 text-left text-ink"
                >
                  Giocatore
                </th>
                {scout.sets.map((set) => (
                  <th
                    key={set.n}
                    scope="col"
                    className={`border-b border-line-strong bg-panel-2 px-2 py-3 text-center ${
                      set.n === scout.setCorrente ? 'text-accent-text' : 'text-ink'
                    }`}
                  >
                    Set {set.n}
                  </th>
                ))}
                <th
                  scope="col"
                  className="border-b border-l-2 border-line-strong bg-panel-2 px-2 py-3 text-center text-ink"
                >
                  Partita
                </th>
              </tr>
            </thead>
            <tbody>
              {partita.righe.map((riga) => (
                <tr
                  key={riga.numero}
                  className="transition-colors even:bg-panel-2/65 hover:bg-accent/5"
                >
                  <CellaGiocatore riga={riga} />
                  {scout.sets.map((set) => {
                    const rigaSet = perSet
                      .get(set.n)
                      .righe.find((voce) => voce.numero === riga.numero);
                    const valore = rigaSet?.tot ?? 0;
                    return (
                      <td
                        key={set.n}
                        className={`border-t border-line-strong/60 px-2 py-2 text-center tabular-nums ${
                          set.n === scout.setCorrente ? 'bg-accent/5' : ''
                        }`}
                      >
                        <span
                          className={
                            valore > 0
                              ? 'text-sm font-semibold text-ink'
                              : 'text-sm text-ink-faint'
                          }
                        >
                          {valore}
                        </span>
                      </td>
                    );
                  })}
                  <td className="border-t border-l-2 border-line-strong/60 px-2 py-2 text-center tabular-nums">
                    <span
                      className={
                        riga.tot > 0 ? 'text-sm font-bold text-ink' : 'text-sm text-ink-faint'
                      }
                    >
                      {riga.tot}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-panel-2">
                <td className="border-t-2 border-line-strong px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink">
                  Totale squadra
                </td>
                {scout.sets.map((set) => (
                  <td
                    key={set.n}
                    className="border-t-2 border-line-strong px-2 py-3 text-center text-sm font-bold tabular-nums text-ink"
                  >
                    {totaliPerSet.get(set.n)}
                  </td>
                ))}
                <td className="border-t-2 border-l-2 border-line-strong px-2 py-3 text-center text-sm font-bold tabular-nums text-ink">
                  {totalePartita}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
