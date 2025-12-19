import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogPartita } from './dialog-partita';

describe('DialogPartita', () => {
  let component: DialogPartita;
  let fixture: ComponentFixture<DialogPartita>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogPartita]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogPartita);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
