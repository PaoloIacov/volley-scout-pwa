import { Injectable } from '@angular/core';
import { Partita } from '../model/partita';

@Injectable({
  providedIn: 'root'
})
export class CalendarioService {
  private storageKey: string = 'partite';

  constructor() { }

  /**
   * Normalizza i dati della partita a lowercase prima di salvare
   */
  private normalizePartita(partita: Partita): Partita {
    return {
      ...partita,
      avversario: partita.avversario.toLowerCase().trim(),
      luogo: partita.luogo.toLowerCase().trim()
    };
  }

  /**
   * Formatta i dati della partita per la visualizzazione
   */
  private formatPartita(partita: Partita): Partita {
    return {
      ...partita,
      avversario: this.capitalize(partita.avversario),
      luogo: this.capitalize(partita.luogo),
      data: this.formatDateItalian(partita.data)
    };
  }

  /**
   * Capitalizza la prima lettera di ogni parola
   */
  private capitalize(str: string): string {
    if (!str) return str;
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Formatta la data in formato italiano (gg/mm/aaaa)
   */
  private formatDateItalian(dateStr: string): string {
    if (!dateStr) return dateStr;
    // Se è già in formato italiano, ritorna così
    if (dateStr.includes('/')) return dateStr;
    // Se è in formato ISO (yyyy-mm-dd), converte
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Converte data italiana in formato ISO per il salvataggio
   */
  private dateToISO(dateStr: string): string {
    if (!dateStr) return dateStr;
    // Se è già in formato ISO, ritorna così
    if (dateStr.includes('-')) return dateStr;
    // Se è in formato italiano (gg/mm/aaaa), converte
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }

  /**
   * Recupera le partite con formattazione per visualizzazione
   */
  getPartite(): Partita[] {
    const partite = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    return partite.map((p: Partita) => this.formatPartita(p));
  }

  /**
   * Salva le partite normalizzate
   */
  setPartite(partite: Partita[]) {
    const normalized = partite.map(p => ({
      ...this.normalizePartita(p),
      data: this.dateToISO(p.data)
    }));
    localStorage.setItem(this.storageKey, JSON.stringify(normalized));
  }

  addPartita(partita: Partita) {
    const partite = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    partite.push({
      ...this.normalizePartita(partita),
      data: this.dateToISO(partita.data)
    });
    localStorage.setItem(this.storageKey, JSON.stringify(partite));
  }

  updatePartita(index: number, partita: Partita) {
    const partite = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    if (index >= 0 && index < partite.length) {
      partite[index] = {
        ...this.normalizePartita(partita),
        data: this.dateToISO(partita.data)
      };
      localStorage.setItem(this.storageKey, JSON.stringify(partite));
    }
  }

  deletePartita(index: number) {
    const partite = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    if (index >= 0 && index < partite.length) {
      partite.splice(index, 1);
      localStorage.setItem(this.storageKey, JSON.stringify(partite));
    }
  }

  addMultiplePartite(partite: Partita[]) {
    const currentPartite = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const normalized = partite.map(p => ({
      ...this.normalizePartita(p),
      data: this.dateToISO(p.data)
    }));
    const updatedPartite = [...currentPartite, ...normalized];
    localStorage.setItem(this.storageKey, JSON.stringify(updatedPartite));
  }
}
