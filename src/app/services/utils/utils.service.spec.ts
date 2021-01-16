import { TestBed } from '@angular/core/testing';

import { UtilsService } from './utils.service';

describe('UtilsService', () => {
  let service: UtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('padding', () => {
    expect(service.paddingHex(4, 8, true)).toBe("0x00000004");
    expect(service.paddingHex(4, 16, true)).toBe("0x0000000000000004");
    expect(service.paddingHex(-1, 8, true)).toBe("0xffffffff");
    expect(service.paddingHex(-1, 16, true)).toBe("0xffffffffffffffff");
    expect(service.paddingHex(-1, 16, false)).toBe("ffffffffffffffff");
    expect(service.paddingHex(-2, 16, false)).toBe("fffffffffffffffe");
    expect(service.paddingHex(-2, 16, true)).toBe("0xfffffffffffffffe");
    expect(service.paddingHex(-3, 16, true)).toBe("0xfffffffffffffffd");


    expect(service.paddingBinary(-2, 8)).toBe("11111110");
    expect(service.paddingBinary(-1, 8)).toBe("11111111");
    expect(service.paddingBinary(1, 8)).toBe("00000001");
    expect(service.paddingBinary(2, 8)).toBe("00000010");
    expect(service.paddingBinary(3, 8)).toBe("00000011");
  });
});
