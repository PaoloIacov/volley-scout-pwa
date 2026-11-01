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

export default function Riconoscimenti({
  riconoscimenti,
  titolo = 'Migliori della partita',
  sottotitolo = 'Classifiche basate sulle azioni registrate nella partita.',
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-line bg-panel-2 px-3 py-2">
        <p className="text-sm font-semibold text-ink">{titolo}</p>
        <p className="text-xs text-ink-mute">{sottotitolo}</p>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2">
        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-mute">
            Top 3 punti in attacco
          </h3>
          {riconoscimenti.topAttacco.length > 0
            ? riconoscimenti.topAttacco.map((valore, indice) => (
                <div
                  key={valore.numero}
                  className="flex items-center justify-between gap-3 border-t border-line py-2"
                >
                  <span className="truncate text-sm font-medium text-ink">
                    {indice + 1}. {valore.nome}
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-accent-text">
                    {valore.punti} pt
                  </span>
                </div>
              ))
            : <div className="border-t border-line py-2 text-sm text-ink-mute">N/D</div>}
        </section>
        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-mute">
            Miglior ricevitore
          </h3>
          {voce(riconoscimenti.migliorRicevitore, (persona) => `${persona.efficienza}%`)}
        </section>
        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-mute">
            Miglior efficienza in attacco
          </h3>
          {voce(riconoscimenti.migliorAttaccante, (persona) => `${persona.efficienza}%`)}
        </section>
        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-mute">
            Miglior battitore
          </h3>
          {voce(riconoscimenti.migliorBattitore, (persona) => `${persona.efficienza}%`)}
        </section>
        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-mute">
            Ace-man
          </h3>
          {voce(riconoscimenti.aceMan, (persona) => `${persona.ace} ace`)}
        </section>
        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-mute">
            Miglior panchinaro
          </h3>
          {voce(riconoscimenti.migliorPanchinaro, (persona) => `${persona.partite} partite`)}
        </section>
        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-mute">
            Pericolo pubblico
          </h3>
          {voce(riconoscimenti.pericoloPubblico, (persona) => `${persona.errori} errori`)}
        </section>
      </div>
    </Card>
  );
}
