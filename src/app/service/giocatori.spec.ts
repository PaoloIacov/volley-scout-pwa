import { TestBed } from '@angular/core/testing';

import { Giocatori } from './giocatori';

describe('Giocatori', () => {
  let service: Giocatori;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Giocatori);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
