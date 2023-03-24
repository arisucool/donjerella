import { TestBed } from '@angular/core/testing';

import { TileDatabaseService } from './tile-database.service';

describe('TileDatabaseService', () => {
  let service: TileDatabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TileDatabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
