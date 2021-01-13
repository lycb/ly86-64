import { TestBed } from '@angular/core/testing';

import { ConditionCodesService } from './condition-codes.service';

describe('ConditionCodesService', () => {
  let service: ConditionCodesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConditionCodesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
