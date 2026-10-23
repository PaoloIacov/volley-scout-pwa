# Evolutive

Richieste evolutive e stato di implementazione. **Tutte le voci sono state
implementate.**

## Riepilogo scout

- [x] **Annulla azione sticky** — la barra con punteggio, tab e pulsante
  "Annulla ultimo" resta fissa sotto l'header (`sticky top-16`) mentre si
  scorre il riepilogo; il pulsante è disponibile anche nella tab Riepilogo.
- [x] **Label delle azioni sticky** — l'intestazione della tabella
  (Ricezione / Attacco / Muro / Battuta con le 4 sotto-colonne di esito) resta
  sticky dentro il contenitore scrollabile del riepilogo.
- [x] **Ricezione `#` senza punto** — il `#` assegna un punto solo per attacco,
  muro e battuta; la ricezione perfetta resta un dato tecnico e non muove il
  punteggio. L'errore (`=`) assegna sempre un punto all'avversario.
- [x] **Contrasto label azioni** — intestazioni in grassetto con testo pieno
  (`text-ink`) e badge degli esiti colorati su sfondo pieno.
- [x] **Contrasto righe tabella** — righe alternate (`even:bg-panel-2/65`),
  hover evidente, bordi `line-strong` e testo `ink`.
- [x] **Divisori più spessi** — bordo verticale doppio tra i gruppi
  Ricezione / Attacco / Muro / Battuta e bordo orizzontale più marcato tra le
  righe e sopra il totale.
- [x] **Colonna Tot rimossa dall'app** — la tabella mostra solo le 4 azioni con
  le sotto-colonne di esito, evitando slittamenti orizzontali. Il Tot (con la
  sua suddivisione per esito) resta negli export Excel/PDF.

## Titolari e sostituzioni

- [x] **Scelta dei 7 titolari a ogni set** — all'aggiunta di un set o
  selezionando un set senza formazione salvata si apre la modale "Titolari del
  set N": 6 giocatori di movimento + 1 libero. La scelta è salvata per set in
  `scout.formazioni`; il libero viene sempre mostrato in fondo.
- [x] **Solo 7 righe in cima alla tabella** — il riepilogo della nostra squadra
  mostra esclusivamente i 7 titolari del set attivo. I dati degli altri
  giocatori restano nei totali di squadra e negli export.
- [x] **Sostituzione al posto del trascinamento** — rimossa la maniglia di
  riordino: accanto a ogni titolare c'è il pulsante di sostituzione, che apre
  la panchina (convocati non in campo) e fa entrare il giocatore scelto,
  mantenendo il vincolo 6 di movimento + 1 libero.
- [x] **Modifica dei titolari** — dal riepilogo il pulsante "Cambia titolari"
  riapre la scelta per il set corrente. Come formazione proposta si usa quella
  del set (o del set precedente, o quella predefinita).

## Punteggio

- [x] **Nessun tetto a 25** — il punteggio non si blocca più a 25: si può
  continuare ad aggiungere punti e si gioca ai vantaggi (vince chi ha almeno
  2 punti di scarto). Nel quinto set il traguardo è 15.
- [x] **Indicatore di stato** — la barra del punteggio mostra "Set point",
  "Vantaggio" e "Set concluso" in base al punteggio del set attivo. Resta solo
  un limite tecnico di sicurezza 0–999 sull'input manuale.
- [x] **Errore avversario** — un tasto dedicato assegna un punto a noi e
  registra un errore avversario senza associarlo a un giocatore. I punti sono
  contati a parte nella cronologia, nel riepilogo (con percentuale sul totale
  dei nostri punti) e nell'export Excel/PDF.

## Tipo di gara

- [x] **Campionato / Amichevole** — il tipo è richiesto sia aggiungendo una
  partita al calendario sia creando uno scout da zero; viene salvato su partita
  e scout e mostrato come badge in Home, Calendario e sessione scout.
- [x] **Amichevole senza limiti** — in campionato restano i limiti dei
  convocati (12 di movimento + 2 liberi); in amichevole non c'è limite, si
  possono convocare tutti i giocatori della rosa (preselezionati).
- [x] **Compatibilità** — partite e scout esistenti senza tipo vengono letti
  come "Campionato"; gli scout senza formazioni usano la formazione
  predefinita (primi 6 di movimento + primo libero tra i convocati).

## Export

- [x] **Tot solo nell'export** — PDF ed Excel continuano a includere la colonna
  Tot con le sotto-colonne di esito e riportano anche il tipo di gara tra le
  informazioni della partita.