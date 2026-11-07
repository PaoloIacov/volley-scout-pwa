import { Card } from '../ui.jsx';

function voce(valore, dettaglio) {
  return valore?.length > 0 ? (
    valore.map((persona) => (
      <div key={persona.numero} className="flex items-center justify-between gap-3 border-t border-line py-2 first:border-t-0">
        <span className="truncate text-sm font-medium text-ink">{persona.nome}</span>
        <span className="shrink-0 text-sm font-bold tabular-nums text-accent-text">{dettaglio(persona)}</span>
      </div>
    ))
  ) : (
    <div className="border-t border-line py-2 text-sm text-ink-mute">N/D</div>
  );
}

const SEZIONI = [
  { chiave: 'topPunti', titolo: 'Top 3 punti fatti', dettaglio: (persona) => `${persona.punti} pt` },
  {
    chiave: 'topEfficienzaRicezione',
    titolo: 'Top 3 efficienza in ricezione',
    dettaglio: (persona) => `${persona.efficienza}%`,
  },
  {
    chiave: 'topEfficienzaAttacco',
    titolo: 'Top 3 efficienza in attacco',
    dettaglio: (persona) => `${persona.efficienza}%`,
  },
  {
    chiave: 'topEfficienzaBattuta',
    titolo: 'Top 3 efficienza in battuta',
    dettaglio: (persona) => `${persona.efficienza}%`,
  },
  { chiave: 'topAceMan', titolo: 'Top 3 Ace-man', dettaglio: (persona) => `${persona.ace} ace` },
  {
    chiave: 'topPericoloPubblico',
    titolo: 'Top 3 Pericolo pubblico',
    dettaglio: (persona) => `${persona.errori} errori`,
  },
];

export default function Riconoscimenti({
  riconoscimenti,
  titolo = 'Migliori della partita',
  sottotitolo = 'Classifiche basate sulle azioni registrate nella partita.',
}) {
  const sezioni = Array.isArray(riconoscimenti.migliorPanchinaro)
    ? [
        ...SEZIONI,
        {
          chiave: 'migliorPanchinaro',
          titolo: 'Miglior panchinaro',
          dettaglio: (persona) => `${persona.partite} partite`,
        },
      ]
    : SEZIONI;

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-line bg-panel-2 px-3 py-2">
        <p className="text-sm font-semibold text-ink">{titolo}</p>
        <p className="text-xs text-ink-mute">{sottotitolo}</p>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2">
        {sezioni.map((sezione) => (
          <section key={sezione.chiave}>
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-mute">
              {sezione.titolo}
            </h3>
            {voce(riconoscimenti[sezione.chiave], sezione.dettaglio)}
          </section>
        ))}
      </div>
    </Card>
  );
}
