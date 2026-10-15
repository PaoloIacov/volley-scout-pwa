import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { getScout, salvaScout, SET_MASSIMO } from '../services/scout.js';
import { getGiocatori } from '../services/giocatori.js';
import { getSquadra } from '../services/squadre.js';
import { shortDate } from '../lib/dates.js';
import { puntiPerEsito } from '../lib/scout-stats.js';
import { Badge, ConfirmDialog, IconButton, SegmentedControl } from '../components/ui.jsx';
import BarraPunteggio from '../components/scout/BarraPunteggio.jsx';
import Inserimento from '../components/scout/Inserimento.jsx';
import Riepilogo from '../components/scout/Riepilogo.jsx';

function clampPunteggio(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), 999);
}

/**
 * Somma (o sottrae) punti a un set, clamped 0-999: usato dagli esiti
 * automatici, dagli errori generici e dai relativi annullamenti.
 */
function applicaPunti(sets, setN, deltaNostro, deltaLoro) {
  return sets.map((set) =>
    set.n === setN
      ? {
          ...set,
          nostro: clampPunteggio(set.nostro + deltaNostro),
          loro: clampPunteggio(set.loro + deltaLoro),
        }
      : set,
  );
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
  /** Set in attesa di conferma per l'eliminazione (null = nessuna). */
  const [setDaEliminare, setSetDaEliminare] = useState(null);

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

  /** Descrive cosa contiene un set, per l'avviso prima dell'eliminazione. */
  const descriviSet = (n) => {
    const set = scout.sets.find((voce) => voce.n === n);
    const azioni = scout.azioni.filter((voce) => voce.set === n).length;
    const generici = (scout.generici ?? []).filter((voce) => voce.set === n).length;
    const parti = [];
    if (azioni > 0) parti.push(`${azioni} ${azioni === 1 ? 'azione' : 'azioni'}`);
    if (generici > 0) {
      parti.push(`${generici} ${generici === 1 ? 'errore generico' : 'errori generici'}`);
    }
    if (set && (set.nostro > 0 || set.loro > 0)) {
      parti.push(`il punteggio ${set.nostro}-${set.loro}`);
    }
    const elenco =
      parti.length <= 1
        ? (parti[0] ?? '')
        : `${parti.slice(0, -1).join(', ')} e ${parti[parti.length - 1]}`;
    return { elenco, vuoto: parti.length === 0 };
  };

  /** Elimina il set con i dati al suo interno e rinumera i set restanti. */
  const eliminaSet = (n) => {
    if (scout.sets.length <= 1) return;
    const restanti = scout.sets.filter((set) => set.n !== n);
    aggiorna({
      ...scout,
      sets: restanti.map((set, index) => ({ ...set, n: index + 1 })),
      azioni: scout.azioni
        .filter((voce) => voce.set !== n)
        .map((voce) => ({ ...voce, set: voce.set > n ? voce.set - 1 : voce.set })),
      generici: (scout.generici ?? [])
        .filter((voce) => voce.set !== n)
        .map((voce) => ({ ...voce, set: voce.set > n ? voce.set - 1 : voce.set })),
      setCorrente: Math.min(
        scout.setCorrente > n ? scout.setCorrente - 1 : scout.setCorrente,
        restanti.length,
      ),
    });
  };

  /** Un set senza dati si elimina subito, uno con dati chiede conferma. */
  const richiediEliminaSet = (n) => {
    if (descriviSet(n).vuoto) eliminaSet(n);
    else setSetDaEliminare(n);
  };

  const confermaEliminaSet = () => {
    const n = setDaEliminare;
    setSetDaEliminare(null);
    if (n !== null) eliminaSet(n);
  };

  /**
   * Registra l'azione e aggiorna in automatico il punteggio del set corrente:
   * # fa segnare un punto a noi, = un punto all'avversario.
   */
  const registra = (numero, azione, esito) => {
    const punti = puntiPerEsito(esito);
    aggiorna({
      ...scout,
      azioni: [...scout.azioni, { ts: Date.now(), set: scout.setCorrente, numero, azione, esito }],
      sets: applicaPunti(scout.sets, scout.setCorrente, punti.nostro, punti.loro),
    });
  };

  /**
   * Errore generico: dà un punto all'avversario e registra la statistica
   * senza associarla ad alcun giocatore.
   */
  const registraErroreGenerico = () =>
    aggiorna({
      ...scout,
      generici: [...(scout.generici ?? []), { ts: Date.now(), set: scout.setCorrente }],
      sets: applicaPunti(scout.sets, scout.setCorrente, 0, 1),
    });

  /** Rimuove l'ultimo dato inserito (azione o errore generico), con il suo punto. */
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
        sets: applicaPunti(scout.sets, ultimoGenerico.set, 0, -1),
      });
      return;
    }
    // Un esito automatico (# o =) aveva mosso il punteggio: lo si riporta indietro.
    const punti = puntiPerEsito(ultimaAzione.esito);
    aggiorna({
      ...scout,
      azioni: scout.azioni.slice(0, -1),
      sets: applicaPunti(scout.sets, ultimaAzione.set, -punti.nostro, -punti.loro),
    });
  };

  /** Toglie un'azione dalla cronologia, riportando indietro il suo punto. */
  const rimuoviAzione = (azioneId) => {
    const azione = scout.azioni.find((voce) => voce.id === azioneId);
    if (!azione) return;
    const punti = puntiPerEsito(azione.esito);
    aggiorna({
      ...scout,
      azioni: scout.azioni.filter((voce) => voce.id !== azioneId),
      sets: applicaPunti(scout.sets, azione.set, -punti.nostro, -punti.loro),
    });
  };

  /** Toglie un errore generico dall'elenco, riportando indietro il punto. */
  const rimuoviGenerico = (genericoId) => {
    const generico = (scout.generici ?? []).find((voce) => voce.id === genericoId);
    if (!generico) return;
    aggiorna({
      ...scout,
      generici: scout.generici.filter((voce) => voce.id !== genericoId),
      sets: applicaPunti(scout.sets, generico.set, 0, -1),
    });
  };

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
        onEliminaSet={richiediEliminaSet}
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
        />
      ) : (
        <Riepilogo scout={scout} giocatori={giocatori} squadraNome={squadra?.nome ?? ''} />
      )}

      <ConfirmDialog
        open={setDaEliminare !== null}
        title="Elimina set"
        message={
          setDaEliminare !== null &&
          `Nel set ${setDaEliminare} ci sono ${descriviSet(setDaEliminare).elenco}. Eliminandolo i dati verranno persi per sempre: vuoi davvero eliminarlo?`
        }
        confirmLabel="Elimina"
        onConfirm={confermaEliminaSet}
        onCancel={() => setSetDaEliminare(null)}
      />
    </div>
  );
}
