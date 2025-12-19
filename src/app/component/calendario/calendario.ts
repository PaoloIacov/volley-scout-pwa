import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarioService } from '../../service/calendario.service';
import { Partita } from '../../model/partita';
import { DialogPartita } from '../dialog-partita/dialog-partita';

@Component({
  selector: 'app-calendario',
  imports: [
    CommonModule,
    DialogPartita
  ],
  templateUrl: './calendario.html',
  styleUrl: './calendario.scss'
})
export class Calendario implements OnInit {
  partite: Partita[] = [];
  showDialog: boolean = false;
  editingPartita: Partita | null = null;
  editingIndex: number = -1;

  constructor(private calendarioService: CalendarioService) {}

  ngOnInit(): void {
    this.loadPartite();
  }

  loadPartite(): void {
    this.partite = this.calendarioService.getPartite();
    // Ordina per data
    this.partite.sort((a, b) => {
      const dateA = this.parseItalianDate(a.data);
      const dateB = this.parseItalianDate(b.data);
      return dateA.getTime() - dateB.getTime();
    });
  }

  private parseItalianDate(dateStr: string): Date {
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return new Date(dateStr);
  }

  openDialog(partita?: Partita, index?: number): void {
    this.editingPartita = partita ? { ...partita } : null;
    this.editingIndex = index !== undefined ? index : -1;
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.editingPartita = null;
    this.editingIndex = -1;
  }

  onSavePartita(partita: Partita): void {
    if (this.editingIndex >= 0) {
      this.calendarioService.updatePartita(this.editingIndex, partita);
    } else {
      this.calendarioService.addPartita(partita);
    }
    this.loadPartite();
    this.closeDialog();
  }

  deletePartita(index: number): void {
    if (confirm(`Sei sicuro di voler eliminare la partita contro ${this.partite[index].avversario}?`)) {
      this.calendarioService.deletePartita(index);
      this.loadPartite();
    }
  }

  exportPartite(): void {
    const dataStr = JSON.stringify(this.partite, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendario_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importPartite(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const importedPartite = JSON.parse(e.target.result);
            if (Array.isArray(importedPartite)) {
              if (confirm(`Vuoi sostituire le ${this.partite.length} partite attuali con le ${importedPartite.length} partite importate?`)) {
                this.calendarioService.setPartite(importedPartite);
                this.loadPartite();
                alert('Partite importate con successo!');
              }
            } else {
              alert('Il file non contiene un array di partite valido.');
            }
          } catch (error) {
            alert('Errore durante l\'importazione del file. Verifica che sia un file JSON valido.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }
}
