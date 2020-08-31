import { TestBed } from '@angular/core/testing';

import { CpuService } from './cpu.service';

describe('CpuService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CpuService = TestBed.get(CpuService);
    expect(service).toBeTruthy();
  });
});
