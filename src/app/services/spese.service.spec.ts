import { TestBed } from '@angular/core/testing';

import { SpeseService } from './spese.service';

describe('SpeseService', () => {
  let service: SpeseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpeseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
