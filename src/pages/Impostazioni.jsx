import { useState } from 'react';
import {
  Database,
  Download,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Settings,
  Sun,
  Upload,
} from 'lucide-react';
import { useSettings } from '../components/SettingsContext.jsx';
import { useToast } from '../components/Toast.jsx';
import {
  Badge,
  Button,
  ConfirmDialog,
  PageHeader,
  Section,
  SegmentedControl,
} from '../components/ui.jsx';
import { getTuttiGiocatori, setTuttiGiocatori } from '../services/giocatori.js';
import { getTuttePartite, setTuttePartite } from '../services/calendario.js';
import {
  getSquadra,
  getSquadraAttiva,
  getSquadre,
  salvaSquadra,
  setSquadraAttiva,
  setSquadre,
} from '../services/squadre.js';
import { TEMA_LABELS } from '../services/impostazioni.js';
import { downloadJSON, openJSONFile } from '../lib/json-io.js';

const TEMA_OPTIONS = [
  { value: 'scuro', label: TEMA_LABELS.scuro, icon: Moon },
  { value: 'chiaro', label: TEMA_LABELS.chiaro, icon: Sun },
  { value: 'sistema', label: TEMA_LABELS.sistema, icon: Monitor },
];

export default function Impostazioni() {
  const { settings, dark, update, replace, reset } = useSettings();
  const toast = useToast();

  const [pendingBackup, setPendingBackup] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    downloadJSON(
      {
        version: 2,
        esportatoIl: new Date().toISOString(),
        squadre: getSquadre(),
        squadraAttiva: getSquadraAttiva()?.id ?? null,
        giocatori: getTuttiGiocatori(),
        partite: getTuttePartite(),
        impostazioni: settings,
      },
      `backup_volley_scout_${new Date().toISOString().split('T')[0]}.json`
    );
    toast.show('Backup completo esportato in JSON.');
  };

  const handleImportClick = async () => {
    const data = await openJSONFile();
    if (data === null) return;

    if (data?.__invalid) {
      toast.show('Il file JSON non è valido.', 'error');
      return;
    }

    if (Array.isArray(data)) {
      // Esportazione singola "giocatori" delle vecchie pagine.
      setPendingBackup({ giocatori: data });
      return;
    }

    if (data && typeof data === 'object') {
      const payload = {};
      if (Array.isArray(data.squadre)) {
        payload.squadre = data.squadre;
        if (data.squadraAttiva) payload.squadraAttiva = data.squadraAttiva;
      }
      if (Array.isArray(data.giocatori)) payload.giocatori = data.giocatori;
      if (Array.isArray(data.partite)) payload.partite = data.partite;
      if (data.impostazioni && typeof data.impostazioni === 'object') {
        payload.impostazioni = data.impostazioni;
      }
      if (Object.keys(payload).length > 0) {
        setPendingBackup(payload);
        return;
      }
    }

    toast.show('Il file non contiene un backup riconoscibile.', 'error');
  };

  const confirmImport = () => {
    const payload = pendingBackup ?? {};
    const identita = payload.impostazioni;

    if (payload.squadre) setSquadre(payload.squadre);

    // Backup preesistente: identità salvata nelle impostazioni, nessuna squadra.
    if (!payload.squadre && !getSquadre().length && identita && (identita.squadra || identita.club)) {
      salvaSquadra({
        nome: identita.squadra ?? '',
        club: identita.club ?? '',
        stagione: identita.stagione ?? '',
        foto: identita.foto ?? '',
        fotoUrl: identita.fotoUrl ?? '',
      });
    }

    if (payload.squadraAttiva && getSquadra(payload.squadraAttiva)) {
      setSquadraAttiva(payload.squadraAttiva);
    }

    // I dati senza squadra finiscono sulla squadra attiva.
    const attivaId = getSquadraAttiva()?.id ?? null;
    const collega = (lista) =>
      lista.map((voce) =>
        voce && (voce.squadraId || !attivaId) ? voce : { ...voce, squadraId: attivaId }
      );

    if (payload.giocatori) setTuttiGiocatori(collega(payload.giocatori));
    if (payload.partite) setTuttePartite(collega(payload.partite));
    if (identita) replace(identita); // nelle impostazioni resta il tema

    setPendingBackup(null);
    toast.show('Backup importato con successo!');
  };

  const handleReset = () => {
    reset();
    setConfirmReset(false);
    toast.show('Impostazioni predefinite ripristinate.', 'info');
  };

  const backupMessage = () => {
    const parts = [];
    if (pendingBackup?.squadre) parts.push(`${pendingBackup.squadre.length} squadre`);
    if (pendingBackup?.giocatori) parts.push(`${pendingBackup.giocatori.length} giocatori`);
    if (pendingBackup?.partite) parts.push(`${pendingBackup.partite.length} partite`);
    if (pendingBackup?.impostazioni) parts.push('il tema');
    return `Vuoi sovrascrivere i dati attuali con il contenuto del file (${parts.join(', ')})? L'operazione non può essere annullata.`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Settings}
        title="Impostazioni"
        subtitle="Aspetto dell'app, backup e ripristino dati"
      />

      {/* Aspetto */}
      <Section icon={Palette} title="Aspetto" subtitle="Tema scuro, chiaro o dal sistema">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SegmentedControl
            ariaLabel="Seleziona il tema"
            options={TEMA_OPTIONS}
            value={settings.tema}
            onChange={(tema) => {
              update({ tema });
              toast.show(`Tema ${TEMA_LABELS[tema].toLowerCase()} applicato.`, 'info');
            }}
          />
          <p className="text-xs text-ink-mute">
            Tema attivo:{' '}
            <Badge className="bg-accent/15 text-accent-text ring-1 ring-accent/25">
              {settings.tema === 'sistema'
                ? `Sistema (${dark ? 'scuro' : 'chiaro'})`
                : TEMA_LABELS[settings.tema]}
            </Badge>
          </p>
        </div>
      </Section>

      {/* Dati e backup */}
      <Section
        icon={Database}
        title="Dati e backup"
        subtitle="Squadre, rosa, calendario e tema in un unico file"
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download size={16} />
            Esporta tutto
          </Button>
          <Button variant="outline" onClick={handleImportClick}>
            <Upload size={16} />
            Importa backup
          </Button>
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={16} />
            Ripristina tema
          </Button>
        </div>
        <p className="mt-3 text-xs text-ink-mute">
          L'export include le squadre, la rosa, il calendario e il tema: conservalo per spostare i
          dati su un altro dispositivo. Nome, foto e stagione delle squadre si modificano dalla
          pagina Squadre.
        </p>
      </Section>

      <ConfirmDialog
        open={Boolean(pendingBackup)}
        title="Importa backup"
        message={backupMessage()}
        confirmLabel="Importa"
        onConfirm={confirmImport}
        onCancel={() => setPendingBackup(null)}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Ripristina impostazioni"
        message="Tornare al tema predefinito? Squadre, giocatori e partite non vengono toccati."
        confirmLabel="Ripristina"
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
