import { useState } from 'react';
import { FileDown, FileSpreadsheet, Undo2 } from 'lucide-react';
import { useToast } from '../Toast.jsx';
import { Button } from '../ui.jsx';
import { esportaScoutExcel, esportaScoutPdf } from '../../lib/export-scout.js';

/**
 * Azioni contestuali della tab Riepilogo: annulla l'ultimo dato inserito ed
 * esporta il riepilogo. Stanno accanto al selettore di tab, a destra, così non
 * rubano una riga alla tabella.
 */
export default function AzioniRiepilogo({
  scout,
  giocatori,
  squadraNome = '',
  puoAnnullare = false,
  onAnnullaUltimo,
}) {
  const toast = useToast();
  const [esportando, setEsportando] = useState('');

  /** Genera e scarica il file: il formato resta attivo mentre si lavora. */
  const esporta = async (formato) => {
    setEsportando(formato);
    try {
      if (formato === 'excel') {
        await esportaScoutExcel(scout, giocatori, squadraNome);
        toast.show('Riepilogo esportato in Excel.');
      } else {
        await esportaScoutPdf(scout, giocatori, squadraNome);
        toast.show('Riepilogo esportato in PDF.');
      }
    } catch (errore) {
      console.error('Esportazione fallita', errore);
      toast.show('Esportazione non riuscita: riprova.', 'error');
    } finally {
      setEsportando('');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onAnnullaUltimo}
        disabled={!puoAnnullare}
        title="Rimuove l'ultimo dato inserito, riportando indietro il punteggio"
      >
        <Undo2 size={15} />
        Annulla ultimo
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => esporta('excel')}
        disabled={esportando !== ''}
        title="Esporta il riepilogo in Excel (.xlsx)"
      >
        <FileSpreadsheet size={15} />
        {esportando === 'excel' ? 'Esporto…' : 'Excel'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => esporta('pdf')}
        disabled={esportando !== ''}
        title="Esporta il riepilogo in PDF"
      >
        <FileDown size={15} />
        {esportando === 'pdf' ? 'Esporto…' : 'PDF'}
      </Button>
    </div>
  );
}
