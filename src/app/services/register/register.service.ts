import { Injectable } from '@angular/core';
import { REGISTERS } from '../../constants';
import { Register } from '../../models/Register';
import { UtilsService } from '../utils/utils.service';
import Long from 'long';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  register: Register[];

  constructor(private utilsService: UtilsService) {
    this.register = [];
    for (let reg of REGISTERS) {
      this.register.push({
        name: reg,
        decimal: new Long(0, 0, false),
        hex: "0x0000000000000000"
      });
    }
  }

  getRegisters(): Register[] {
    return this.register;
  }

  getValueByRegister(name: string): Long {
    return this.register[this.utilsService.register2index(name)].decimal.toSigned();
  }

  // given a register name and a value, save that number to the register and convert that to a hex string
  setValueByRegister(name: string, decimal: Long): void {
    this.register[this.utilsService.register2index(name)].decimal = decimal.toSigned();
    var binaryNum = decimal.toString(16);
    this.register[this.utilsService.register2index(name)].hex = this.utilsService.paddingHex(binaryNum, 16, true);
  }

  reset(): void {
    for (let i = 0; i < this.register.length; i++) {
      this.register[i].decimal = Long.ZERO;
      this.register[i].hex = "0x0000000000000000";
    }
  }
}
