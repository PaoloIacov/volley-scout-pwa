import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GiocatoriService {
  private storageKey: string = 'giocatori';

  constructor() { }

  getGiocatori(): any[] {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  setGiocatori(giocatori: any[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(giocatori));
  }

  addGiocatore(giocatore: any) {
    const giocatori = this.getGiocatori();
    giocatori.push(giocatore);
    this.setGiocatori(giocatori);
  }

  deleteGiocatore(id: number) {
    const giocatori = this.getGiocatori();
    this.setGiocatori(giocatori.filter(g => g.id !== id));
  }

  addMultipleGiocatori(giocatori: any[]) {
    const currentGiocatori = this.getGiocatori();
    const updatedGiocatori = [...currentGiocatori, ...giocatori];
    this.setGiocatori(updatedGiocatori);
  }
}
