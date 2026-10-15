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

  const annullaUltimo = () => aggiorna({ ...scout, azioni: scout.azioni.slice(0, -1) });

  const rimuoviAzione = (azioneId) =>
    aggiorna({ ...scout, azioni: scout.azioni.filter((azione) => azione.id !== azioneId) });

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
          onAggiungiNumero={aggiungiNumero}
        />
      ) : (
        <Riepilogo scout={scout} giocatori={giocatori} squadraNome={squadra?.nome ?? ''} />
      )}
    </div>
  );
}
