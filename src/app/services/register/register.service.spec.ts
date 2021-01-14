import { TestBed } from '@angular/core/testing';

import { RegisterService } from './register.service';
import * as Constants from "../../constants";
import Long from 'long';

describe('RegisterService', () => {
  let service: RegisterService;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.get(RegisterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('create an array of size 15 with default values', () => {
    let reg = service.getRegisters();
    expect(reg.length).toBe(Constants.REGISTERS.length);
    for (let i = 0; i < Constants.REGISTERS.length; i++) {
      expect(reg[i].name).toEqual(Constants.REGISTERS[i]);
      expect(reg[i].value).toEqual(Long.ZERO);
      expect(reg[i].hex).toEqual('0x0000000000000000')
    }
  });

  it('reset', () => {
    for (let i = 0; i < Constants.REGISTERS.length; i++) {
      service.setValueByRegister(Constants.REGISTERS[i], Long.ONE);
    }
    for (let i = 0; i < Constants.REGISTERS.length; i++) {
      expect(service.getValueByRegister(Constants.REGISTERS[i])).toEqual(Long.ONE);
    }
    service.reset();
    for (let i = 0; i < Constants.REGISTERS.length; i++) {
      expect(service.getValueByRegister(Constants.REGISTERS[i])).toEqual(Long.ZERO);
    }
  });

  it('register2index', () => {
    for (let i = 0; i < Constants.REGISTERS.length; i++) {
      expect(service.register2index(Constants.REGISTERS[i])).toBe(i)
    }
  });

  it('index2register', () => {
    for (let i = 0; i < Constants.REGISTERS.length; i++) {
      expect(service.index2register(i)).toBe(Constants.REGISTERS[i])
    }
  });

  it('setValueByRegister & getValueByRegister', () => {
    expect(service.getValueByRegister('RAX')).toEqual(Long.ZERO);
    expect(service.getValueByRegister('RCX')).toEqual(Long.ZERO);
    service.setValueByRegister('RAX', Long.ONE);
    expect(service.getValueByRegister('RAX')).toEqual(Long.ONE);
    expect(service.getValueByRegister('RCX')).toEqual(Long.ZERO);
    service.setValueByRegister('RCX', Long.ONE);
    expect(service.getValueByRegister('RAX')).toEqual(Long.ONE);
    expect(service.getValueByRegister('RCX')).toEqual(Long.ONE)
  });
});
