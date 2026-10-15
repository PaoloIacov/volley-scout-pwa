import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { getScout, salvaScout, SET_MASSIMO } from '../services/scout.js';
import { getGiocatori } from '../services/giocatori.js';
import { getSquadra } from '../services/squadre.js';
import { shortDate } from '../lib/dates.js';
import { Badge, IconButton, SegmentedControl } from '../components/ui.jsx';
import BarraPunteggio from '../components/scout/BarraPunteggio.jsx';
import Inserimento from '../components/scout/Inserimento.jsx';
import Riepilogo from '../components/scout/Riepilogo.jsx';

function clampPunteggio(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), 999);
}

const TABS = [
  { value: 'inserimento', label: 'Inserimento' },
  { value: 'riepilogo', label: 'Riepilogo' },
];

/**
 * Schermata di scouting: punteggio sempre visibile e due tab,
 * Inserimento (touch friendly) e Riepilogo. Ogni modifica è salvata
 * subito in localStorage: si può uscire e rientrare senza perdere i dati.
 */
export default function ScoutSessione() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scout, setScout] = useState(() => getScout(id));
  const [tab, setTab] = useState('inserimento');
  const [numeroSel, setNumeroSel] = useState(null);
  const [azioneSel, setAzioneSel] = useState(null);

  /** Applica la modifica, la salva subito e aggiorna lo stato. */
  const aggiorna = (next) => setScout(salvaScout(next));

  const cambiaPunteggio = (setN, campo, valore) =>
    aggiorna({
      ...scout,
      sets: scout.sets.map((set) =>
        set.n === setN ? { ...set, [campo]: clampPunteggio(valore) } : set,
      ),
    });

  const deltaPunteggio = (setN, campo, delta) => {
    const set = scout.sets.find((voce) => voce.n === setN);
    cambiaPunteggio(setN, campo, Math.max(0, (set?.[campo] ?? 0) + delta));
  };

  const selezionaSet = (n) => aggiorna({ ...scout, setCorrente: n });

  const aggiungiSet = () => {
    if (scout.sets.length >= SET_MASSIMO) return;
    const n = scout.sets.length + 1;
    aggiorna({ ...scout, sets: [...scout.sets, { n, nostro: 0, loro: 0 }], setCorrente: n });
  };

  const registra = (numero, azione, esito) =>
    aggiorna({
      ...scout,
      azioni: [...scout.azioni, { ts: Date.now(), set: scout.setCorrente, numero, azione, esito }],
    });

  /**
   * Errore generico: dà un punto all'avversario e registra la statistica
   * senza associarla ad alcun giocatore.
   */
  const registraErroreGenerico = () =>
    aggiorna({
      ...scout,
      generici: [...(scout.generici ?? []), { ts: Date.now(), set: scout.setCorrente }],
      sets: scout.sets.map((set) =>
        set.n === scout.setCorrente ? { ...set, loro: Math.min(set.loro + 1, 999) } : set,
      ),
    });

  /** Rimuove l'ultimo dato inserito (azione o errore generico). */
  const annullaUltimo = () => {
    const ultimaAzione = scout.azioni[scout.azioni.length - 1] ?? null;
    const ultimoGenerico = scout.generici?.[scout.generici.length - 1] ?? null;
    const genericoUltimo = ultimoGenerico && (!ultimaAzione || ultimoGenerico.ts > ultimaAzione.ts);
    if (!ultimaAzione && !ultimoGenerico) return;
    if (genericoUltimo) {
      // L'errore generico aveva aggiunto un punto: lo si toglie insieme.
      aggiorna({
        ...scout,
        generici: scout.generici.filter((voce) => voce.id !== ultimoGenerico.id),
        sets: scout.sets.map((set) =>
          set.n === ultimoGenerico.set ? { ...set, loro: Math.max(0, set.loro - 1) } : set,
        ),
      });
      return;
    }
    aggiorna({ ...scout, azioni: scout.azioni.slice(0, -1) });
  };

  const rimuoviAzione = (azioneId) =>
    aggiorna({ ...scout, azioni: scout.azioni.filter((azione) => azione.id !== azioneId) });

  /** Toglie un errore generico dall'elenco, riportando indietro il punto. */
  const rimuoviGenerico = (genericoId) => {
    const generico = (scout.generici ?? []).find((voce) => voce.id === genericoId);
    if (!generico) return;
    aggiorna({
      ...scout,
      generici: scout.generici.filter((voce) => voce.id !== genericoId),
      sets: scout.sets.map((set) =>
        set.n === generico.set ? { ...set, loro: Math.max(0, set.loro - 1) } : set,
      ),
    });
  };

  const aggiungiNumero = (numero) =>
    aggiorna({ ...scout, numeriExtra: [...scout.numeriExtra, numero] });

  if (!scout) return <Navigate to="/scout" replace />;

  const squadra = getSquadra(scout.squadraId);
  const giocatori = getGiocatori(scout.squadraId);
  const osservata =
    scout.squadraOsservata === 'propria' ? (squadra?.nome ?? 'La mia squadra') : 'Avversaria';

  return (
    <div className="space-y-4">
      {/* Intestazione */}
      <div className="flex items-center gap-3">
        <IconButton label="Torna all'elenco scout" onClick={() => navigate('/scout')}>
          <ArrowLeft size={18} />
        </IconButton>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 truncate text-xl font-semibold tracking-tight text-ink">
            <ClipboardList size={20} className="shrink-0 text-accent-text" />
            vs {scout.avversario}
          </h1>
          <p className="mt-0.5 truncate text-xs text-ink-mute">
            {[shortDate(scout.data), scout.luogo, `Scout: ${osservata}`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <Badge className="shrink-0 bg-accent/15 text-accent-text ring-1 ring-accent/25">
          {scout.azioni.length} {scout.azioni.length === 1 ? 'azione' : 'azioni'}
        </Badge>
      </div>

      {/* Punteggio: sempre visibile, modificabile con +/- o a tastiera */}
      <BarraPunteggio
        scout={scout}
        onCambiaPunteggio={cambiaPunteggio}
        onDeltaPunteggio={deltaPunteggio}
        onSelezionaSet={selezionaSet}
        onAggiungiSet={aggiungiSet}
        onErroreGenerico={registraErroreGenerico}
      />

      <SegmentedControl ariaLabel="Sezione scout" options={TABS} value={tab} onChange={setTab} />

      {tab === 'inserimento' ? (
        <Inserimento
          scout={scout}
          giocatori={giocatori}
          numeroSel={numeroSel}
          setNumeroSel={setNumeroSel}
          azioneSel={azioneSel}
          setAzioneSel={setAzioneSel}
          onRegistra={registra}
          onAnnullaUltimo={annullaUltimo}
          onRimuoviAzione={rimuoviAzione}
          onRimuoviGenerico={rimuoviGenerico}
          onAggiungiNumero={aggiungiNumero}
        />
      ) : (
        <Riepilogo scout={scout} giocatori={giocatori} squadraNome={squadra?.nome ?? ''} />
      )}
    </div>
  );
}
