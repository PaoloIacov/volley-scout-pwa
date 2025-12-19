import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GiocatoriService } from '../../service/giocatori.service';
import { Giocatore } from '../../model/giocatore';
import { DialogGiocatore } from '../dialog-giocatore/dialog-giocatore';

@Component({
  selector: 'app-giocatori',
  imports: [
    CommonModule,
    DialogGiocatore
  ],
  templateUrl: './giocatori.html',
  styleUrl: './giocatori.scss'
})
export class Giocatori implements OnInit {
  giocatori: Giocatore[] = [];
  showDialog: boolean = false;
  editingGiocatore: Giocatore | null = null;
  editingIndex: number = -1;

  constructor(private giocatoriService: GiocatoriService) {}

  ngOnInit(): void {
    this.loadGiocatori();
  }

  loadGiocatori(): void {
    this.giocatori = this.giocatoriService.getGiocatori();
    this.giocatori.sort((a, b) => a.numeroMaglia - b.numeroMaglia);
  }

  openDialog(giocatore?: Giocatore, index?: number): void {
    this.editingGiocatore = giocatore ? { ...giocatore } : null;
    this.editingIndex = index !== undefined ? index : -1;
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.editingGiocatore = null;
    this.editingIndex = -1;
  }

  onSaveGiocatore(giocatore: Giocatore): void {
    if (this.editingIndex >= 0) {
      this.giocatori[this.editingIndex] = giocatore;
    } else {
      this.giocatori.push(giocatore);
    }
    this.giocatoriService.setGiocatori(this.giocatori);
    this.loadGiocatori();
    this.closeDialog();
  }

  deleteGiocatore(index: number): void {
    if (confirm(`Sei sicuro di voler eliminare ${this.giocatori[index].nome} ${this.giocatori[index].cognome}?`)) {
      this.giocatori.splice(index, 1);
      this.giocatoriService.setGiocatori(this.giocatori);
      this.loadGiocatori();
    }
  }

  exportGiocatori(): void {
    const dataStr = JSON.stringify(this.giocatori, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `giocatori_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importGiocatori(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const importedGiocatori = JSON.parse(e.target.result);
            if (Array.isArray(importedGiocatori)) {
              if (confirm(`Vuoi sostituire i ${this.giocatori.length} giocatori attuali con i ${importedGiocatori.length} giocatori importati?`)) {
                this.giocatori = importedGiocatori;
                this.giocatoriService.setGiocatori(this.giocatori);
                this.loadGiocatori();
                alert('Giocatori importati con successo!');
              }
            } else {
              alert('Il file non contiene un array di giocatori valido.');
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

  getRuoloIcon(ruolo: string): string {
    const icons: { [key: string]: string } = {
      'Schiacciatore': 'bi-lightning-fill',
      'Opposto': 'bi-arrow-up-right-circle-fill',
      'Centrale': 'bi-shield-fill',
      'Libero': 'bi-shield-check',
      'Palleggiatore': 'bi-hand-index-thumb'
    };
    return icons[ruolo] || 'bi-person-fill';
  }
}
