import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { getScout, salvaScout, SET_MASSIMO } from '../services/scout.js';
import { getGiocatori } from '../services/giocatori.js';
import { getSquadra } from '../services/squadre.js';
import { shortDate } from '../lib/dates.js';
import {
  puntiPerEsito,
  costruisciRiepilogo,
  contaErroriAvversari,
  contaGenerici,
  formazioneDelSet,
  formazionePredefinita,
  impostaFormazione,
  ordinaNumeri,
} from '../lib/scout-stats.js';
import { Badge, ConfirmDialog, IconButton, SegmentedControl } from '../components/ui.jsx';
import BarraPunteggio from '../components/scout/BarraPunteggio.jsx';
import Inserimento from '../components/scout/Inserimento.jsx';
import Riepilogo from '../components/scout/Riepilogo.jsx';
import Totali from '../components/scout/Totali.jsx';
import AzioniRiepilogo from '../components/scout/AzioniRiepilogo.jsx';
import FormazioneModal from '../components/scout/FormazioneModal.jsx';

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
  { value: 'totali', label: 'Totali' },
];

/**
 * Set per cui va scelta la formazione appena si apre lo scout: il primo set
 * (o quello corrente) se non ha ancora titolari salvati. Così anche il set 1
 * chiede subito i 7 titolari, come i set successivi.
 */
function setDaFormare(scout) {
  if (!scout || scout.squadraOsservata !== 'propria') return null;
  if (getGiocatori(scout.squadraId).length === 0) return null;
  return formazioneDelSet(scout, scout.setCorrente) ? null : scout.setCorrente;
}

/**
 * Schermata di scouting: punteggio sempre visibile e tre tab,
 * Inserimento (touch friendly), Riepilogo e Totali. Ogni modifica è salvata
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
  /** Set per cui si stanno scegliendo i 7 titolari (null = modale chiusa). */
  const [setFormazione, setSetFormazione] = useState(() => setDaFormare(scout));

  /** Applica la modifica, la salva subito e aggiorna lo stato. */
  const aggiorna = (next) => setScout(salvaScout(next));

  /**
   * Formazione del set: quella scelta esplicitamente oppure quella predefinita
   * (primi 6 di movimento + primo libero tra i convocati). Solo per la nostra
   * squadra: quando si scoutizza l'avversaria i numeri restano 1-20.
   */
  const formazionePerSet = (setN) => {
    if (!scout || scout.squadraOsservata !== 'propria') return undefined;
    const rosa = getGiocatori(scout.squadraId);
    const convocati =
      Array.isArray(scout.convocati) && scout.convocati.length > 0
        ? new Set(scout.convocati)
        : null;
    const numeri = ordinaNumeri(
      rosa
        .filter((giocatore) => !convocati || convocati.has(giocatore.numeroMaglia))
        .map((giocatore) => giocatore.numeroMaglia),
      scout.ordineGiocatori,
    );
    return formazioneDelSet(scout, setN) ?? formazionePredefinita(numeri, rosa);
  };

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

  const selezionaSet = (n) => {
    aggiorna({ ...scout, setCorrente: n });
    // A ogni nuovo set si scelgono i 7 titolari (se non sono già impostati).
    if (
      n !== scout.setCorrente &&
      scout.squadraOsservata === 'propria' &&
      !formazioneDelSet(scout, n) &&
      getGiocatori(scout.squadraId).length > 0
    ) {
      setSetFormazione(n);
    }
  };

  /** Le sostituzioni valgono per il set corrente e restano salvate. */
  const cambiaInCampo = (inCampo) =>
    aggiorna({
      ...scout,
      inCampo,
      formazioni: impostaFormazione(scout, scout.setCorrente, inCampo),
    });

  /**
   * Sostituzione dalla tabella del riepilogo: stesso vincolo dell'inserimento
   * (6 di movimento + 1 libero), salvata nella formazione del set corrente.
   */
  const sostituisci = (uscita, entrata) => {
    const attuale = formazionePerSet(scout.setCorrente) ?? [];
    if (!attuale.includes(uscita)) return;
    const prossima = attuale.map((numero) => (numero === uscita ? entrata : numero));
    aggiorna({
      ...scout,
      inCampo: prossima,
      formazioni: impostaFormazione(scout, scout.setCorrente, prossima),
    });
  };

  const confermaFormazione = (numeri) => {
    if (setFormazione === null) return;
    aggiorna({
      ...scout,
      formazioni: impostaFormazione(scout, setFormazione, numeri),
      ...(setFormazione === scout.setCorrente ? { inCampo: numeri } : {}),
    });
    setSetFormazione(null);
  };

  const aggiungiSet = () => {
    if (scout.sets.length >= SET_MASSIMO) return;
    const n = scout.sets.length + 1;
    aggiorna({ ...scout, sets: [...scout.sets, { n, nostro: 0, loro: 0 }], setCorrente: n });
    // All'inizio di ogni set si scelgono i 7 titolari.
    if (scout.squadraOsservata === 'propria' && getGiocatori(scout.squadraId).length > 0) {
      setSetFormazione(n);
    }
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
      formazioni: (scout.formazioni ?? [])
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
   * # fa segnare un punto a noi (tranne che per la ricezione), = un punto
   * all'avversario.
   */
  const registra = (numero, azione, esito) => {
    const punti = puntiPerEsito(esito, azione);
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

  /** Errore avversario: dà un punto a noi, senza associarlo a un giocatore. */
  const registraErroreAvversario = () =>
    aggiorna({
      ...scout,
      erroriAvversari: [
        ...(scout.erroriAvversari ?? []),
        { ts: Date.now(), set: scout.setCorrente },
      ],
      sets: applicaPunti(scout.sets, scout.setCorrente, 1, 0),
    });

  /** Rimuove l'ultimo dato inserito (azione o errore), con il suo punto. */
  const annullaUltimo = () => {
    const eventi = [
      ...scout.azioni.map((voce) => ({ ...voce, tipo: 'azione' })),
      ...(scout.generici ?? []).map((voce) => ({ ...voce, tipo: 'generico' })),
      ...(scout.erroriAvversari ?? []).map((voce) => ({ ...voce, tipo: 'avversario' })),
    ].sort((a, b) => a.ts - b.ts);
    const ultimo = eventi[eventi.length - 1] ?? null;
    if (!ultimo) return;

    if (ultimo.tipo === 'generico') {
      // L'errore generico aveva aggiunto un punto all'avversario: lo si toglie.
      aggiorna({
        ...scout,
        generici: scout.generici.filter((voce) => voce.id !== ultimo.id),
        sets: applicaPunti(scout.sets, ultimo.set, 0, -1),
      });
      return;
    }
    if (ultimo.tipo === 'avversario') {
      // L'errore avversario aveva aggiunto un punto a noi: lo si toglie.
      aggiorna({
        ...scout,
        erroriAvversari: scout.erroriAvversari.filter((voce) => voce.id !== ultimo.id),
        sets: applicaPunti(scout.sets, ultimo.set, -1, 0),
      });
      return;
    }
    // Un esito automatico (# o =) aveva mosso il punteggio: lo si riporta indietro.
    const punti = puntiPerEsito(ultimo.esito, ultimo.azione);
    aggiorna({
      ...scout,
      azioni: scout.azioni.filter((voce) => voce.id !== ultimo.id),
      sets: applicaPunti(scout.sets, ultimo.set, -punti.nostro, -punti.loro),
    });
  };

  /** Toglie un'azione dalla cronologia, riportando indietro il suo punto. */
  const rimuoviAzione = (azioneId) => {
    const azione = scout.azioni.find((voce) => voce.id === azioneId);
    if (!azione) return;
    const punti = puntiPerEsito(azione.esito, azione.azione);
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

  /** Toglie un errore avversario dall'elenco, riportando indietro il nostro punto. */
  const rimuoviErroreAvversario = (erroreId) => {
    const errore = (scout.erroriAvversari ?? []).find((voce) => voce.id === erroreId);
    if (!errore) return;
    aggiorna({
      ...scout,
      erroriAvversari: scout.erroriAvversari.filter((voce) => voce.id !== erroreId),
      sets: applicaPunti(scout.sets, errore.set, -1, 0),
    });
  };

  if (!scout) return <Navigate to="/scout" replace />;

  const squadra = getSquadra(scout.squadraId);
  const giocatori = getGiocatori(scout.squadraId);
  const formazione = formazionePerSet(scout.setCorrente);
  const osservata =
    scout.squadraOsservata === 'propria' ? (squadra?.nome ?? 'La mia squadra') : 'Avversaria';
  const genericiTotali = contaGenerici(scout);
  const avversariTotali = contaErroriAvversari(scout);
  /** C'è qualcosa da annullare? */
  const puoAnnullare = scout.azioni.length > 0 || genericiTotali > 0 || avversariTotali > 0;
  /** Il riepilogo sarebbe vuoto (niente righe e nessun errore)? */
  const riepilogoVuoto =
    costruisciRiepilogo(scout, giocatori).righe.length === 0 &&
    genericiTotali === 0 &&
    avversariTotali === 0;
  /** Formazione proposta aprendo la scelta dei titolari. */
  const formazioneIniziale =
    setFormazione !== null
      ? (formazioneDelSet(scout, setFormazione) ??
        formazioneDelSet(scout, setFormazione - 1) ??
        formazione ??
        [])
      : [];

  return (
    <div className="space-y-3">
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
        <Badge
          className={
            scout.tipo === 'amichevole'
              ? 'shrink-0 bg-info/10 text-info ring-1 ring-info/30'
              : 'shrink-0 bg-panel-2 text-ink-soft ring-1 ring-line-strong'
          }
        >
          {scout.tipo === 'amichevole' ? 'Amichevole' : 'Campionato'}
        </Badge>
        <Badge className="shrink-0 bg-accent/15 text-accent-text ring-1 ring-accent/25">
          {scout.azioni.length} {scout.azioni.length === 1 ? 'azione' : 'azioni'}
        </Badge>
      </div>

      {/* Punteggio e azioni: restano fissi sotto l'header mentre si scorre */}
      <div className="sticky top-16 z-30 -mx-1 space-y-2 bg-app/95 px-1 pb-2 pt-1 backdrop-blur">
        <BarraPunteggio
          scout={scout}
          onCambiaPunteggio={cambiaPunteggio}
          onDeltaPunteggio={deltaPunteggio}
          onSelezionaSet={selezionaSet}
          onAggiungiSet={aggiungiSet}
          onErroreGenerico={registraErroreGenerico}
          onErroreAvversario={registraErroreAvversario}
          onEliminaSet={richiediEliminaSet}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <SegmentedControl ariaLabel="Sezione scout" options={TABS} value={tab} onChange={setTab} />
          {tab !== 'inserimento' && !riepilogoVuoto && (
            <AzioniRiepilogo
              scout={scout}
              giocatori={giocatori}
              squadraNome={squadra?.nome ?? ''}
              puoAnnullare={puoAnnullare}
              onAnnullaUltimo={annullaUltimo}
            />
          )}
        </div>
      </div>

      {tab === 'inserimento' ? (
        <Inserimento
          scout={scout}
          giocatori={giocatori}
          formazione={formazione}
          numeroSel={numeroSel}
          setNumeroSel={setNumeroSel}
          azioneSel={azioneSel}
          setAzioneSel={setAzioneSel}
          onRegistra={registra}
          onCambiaInCampo={cambiaInCampo}
          onAnnullaUltimo={annullaUltimo}
          onRimuoviAzione={rimuoviAzione}
          onRimuoviGenerico={rimuoviGenerico}
          onRimuoviErroreAvversario={rimuoviErroreAvversario}
        />
      ) : tab === 'riepilogo' ? (
        <Riepilogo
          scout={scout}
          giocatori={giocatori}
          formazione={formazione}
          onRegistra={registra}
          onSostituisci={sostituisci}
          onScegliFormazione={() => setSetFormazione(scout.setCorrente)}
        />
      ) : (
        <Totali scout={scout} giocatori={giocatori} />
      )}

      <FormazioneModal
        open={setFormazione !== null}
        numeroSet={setFormazione ?? scout.setCorrente}
        giocatori={giocatori}
        convocati={scout.convocati}
        iniziale={formazioneIniziale}
        onCancel={() => setSetFormazione(null)}
        onConfirm={confermaFormazione}
      />

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
