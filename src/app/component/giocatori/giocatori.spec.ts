import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Giocatori } from './giocatori';

describe('Giocatori', () => {
  let component: Giocatori;
  let fixture: ComponentFixture<Giocatori>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Giocatori]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Giocatori);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
