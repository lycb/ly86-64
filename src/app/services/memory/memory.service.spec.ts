import { TestBed } from '@angular/core/testing';

import { MemoryService } from './memory.service';
import * as Constants from "../../constants";
import Long from 'long';

describe('MemoryService', () => {
  let service: MemoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MemoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('create an empty the array of size 0x1000', () => {
    let mem = service.getMemory();
    expect(mem.length).toBe(Constants.MEMSIZE);
    for (let i = 0; i < Constants.MEMSIZE; i++) {
    	expect(mem[i]).toBe(Long.ZERO);
    }
  });

  it('reset', () => {
    let mem = service.getMemory();
    for (let i = 0; i < Constants.MEMSIZE; i++) {
  		mem[i] = Long.ONE;
  	}
    for (let i = 0; i < Constants.MEMSIZE; i++) {
    	expect(mem[i]).not.toBe(Long.ZERO);
    }
    service.reset();
    for (let i = 0; i < Constants.MEMSIZE; i++) {
    	expect(mem[i]).toBe(Long.ZERO);
    }
  });

  it('putByte -- with errors', () => {
  	expect(service.getError()).toBeFalsy();
    service.putByte(Long.ONE, 0x1001)
    expect(service.getError()).toBeTruthy();

    service.reset();
    expect(service.getError()).toBeFalsy();
    service.putByte(Long.ONE, -1)
    expect(service.getError()).toBeTruthy();
  });

  it('getByte -- with errors', () => {
    expect(service.getError()).toBeFalsy();
    service.getByte(0x1001)
    expect(service.getError()).toBeTruthy();

    service.reset();
    expect(service.getError()).toBeFalsy();
    service.getByte(-1)
    expect(service.getError()).toBeTruthy();
  });

  it('putLong -- with errors', () => {
    expect(service.getError()).toBeFalsy();
    service.putLong(Long.ONE, 0x1001)
    expect(service.getError()).toBeTruthy();

    service.reset();
    expect(service.getError()).toBeFalsy();
    service.putLong(Long.ONE, -1)
    expect(service.getError()).toBeTruthy();
  });

  it('getLong -- with errors', () => {
    expect(service.getError()).toBeFalsy();
    service.getLong(0x1001)
    expect(service.getError()).toBeTruthy();

    service.reset();
    expect(service.getError()).toBeFalsy();
    service.getLong(-1)
    expect(service.getError()).toBeTruthy();
  });

  it('putLong & getLong -- without errors', () => {
    expect(service.getLong(0)).toEqual(Long.ZERO);
    expect(service.getLong(8)).toEqual(Long.ZERO);
    service.putLong(Long.ONE, 0);
    expect(service.getLong(0)).toEqual(Long.ONE);
    expect(service.getLong(8)).toEqual(Long.ZERO);
    service.putLong(Long.ONE, 8);
    expect(service.getLong(0)).toEqual(Long.ONE);
    expect(service.getLong(8)).toEqual(Long.ONE);
  });

  it('putByte & getByte -- without errors', () => {
    expect(service.getByte(0)).toEqual(Long.ZERO);
    expect(service.getByte(1)).toEqual(Long.ZERO);
    service.putByte(Long.ONE, 0);
    expect(service.getByte(0)).toEqual(Long.ONE);
    expect(service.getByte(1)).toEqual(Long.ZERO);
    service.putByte(Long.ONE, 1);
    expect(service.getByte(0)).toEqual(Long.ONE);
    expect(service.getByte(1)).toEqual(Long.ONE);
  });
});
