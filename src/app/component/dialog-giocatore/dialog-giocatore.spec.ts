import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogGiocatore } from './dialog-giocatore';

describe('DialogGiocatore', () => {
  let component: DialogGiocatore;
  let fixture: ComponentFixture<DialogGiocatore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogGiocatore]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogGiocatore);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
