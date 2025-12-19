import { Injectable } from '@angular/core';
import { Giocatore } from '../model/giocatore';

@Injectable({
  providedIn: 'root'
})
export class GiocatoriService {
  private storageKey: string = 'giocatori';

  constructor() { }

  /**
   * Normalizza i dati del giocatore a lowercase prima di salvare
   */
  private normalizeGiocatore(giocatore: Giocatore): Giocatore {
    return {
      ...giocatore,
      nome: giocatore.nome.toLowerCase().trim(),
      cognome: giocatore.cognome.toLowerCase().trim(),
      ruolo: giocatore.ruolo.toLowerCase().trim()
    };
  }

  /**
   * Formatta i dati del giocatore per la visualizzazione
   */
  private formatGiocatore(giocatore: Giocatore): Giocatore {
    return {
      ...giocatore,
      nome: this.capitalize(giocatore.nome),
      cognome: this.capitalize(giocatore.cognome),
      ruolo: this.capitalize(giocatore.ruolo)
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
   * Recupera i giocatori con formattazione per visualizzazione
   */
  getGiocatori(): Giocatore[] {
    const giocatori = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    return giocatori.map((g: Giocatore) => this.formatGiocatore(g));
  }

  /**
   * Salva i giocatori normalizzati
   */
  setGiocatori(giocatori: Giocatore[]) {
    const normalized = giocatori.map(g => this.normalizeGiocatore(g));
    localStorage.setItem(this.storageKey, JSON.stringify(normalized));
  }

  addGiocatore(giocatore: Giocatore) {
    const giocatori = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    giocatori.push(this.normalizeGiocatore(giocatore));
    localStorage.setItem(this.storageKey, JSON.stringify(giocatori));
  }

  updateGiocatore(index: number, giocatore: Giocatore) {
    const giocatori = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    if (index >= 0 && index < giocatori.length) {
      giocatori[index] = this.normalizeGiocatore(giocatore);
      localStorage.setItem(this.storageKey, JSON.stringify(giocatori));
    }
  }

  deleteGiocatore(index: number) {
    const giocatori = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    if (index >= 0 && index < giocatori.length) {
      giocatori.splice(index, 1);
      localStorage.setItem(this.storageKey, JSON.stringify(giocatori));
    }
  }

  addMultipleGiocatori(giocatori: Giocatore[]) {
    const currentGiocatori = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const normalized = giocatori.map(g => this.normalizeGiocatore(g));
    const updatedGiocatori = [...currentGiocatori, ...normalized];
    localStorage.setItem(this.storageKey, JSON.stringify(updatedGiocatori));
  }
}
