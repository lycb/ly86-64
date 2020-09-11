import { Injectable } from '@angular/core';
import { REGISTERS } from '../../constants';
import { Register } from '../../models/Register';
import Long from 'long';
 
@Injectable({
  providedIn: 'root'
})
export class RegisterService {
	register: Register[];

  constructor() { 
  	this.register = [];
	  for (let reg of REGISTERS) {
  		this.register.push({
  			name: reg,
  			value: Long.ZERO,
        hex: "0x0000000000000000"
  		});
	  }
	}

  getRegisters(): Register[] {
  	return this.register;
  }

  getValueByRegister(name: string): Long {
    return this.register[this.register2index(name)].value;
  }

  setValueByRegister(name: string, value: Long): void {
    this.register[this.register2index(name)].value = value;
    var binaryNum = value.toNumber().toString(16);
    this.register[this.register2index(name)].hex = this.paddingHex(binaryNum, 16);

  }

  register2index(name: string): number {
    switch(name) {
      case "RAX": return 0;
      case "RCX": return 1;
      case "RDX": return 2;
      case "RBX": return 3;
      case "RSP": return 4;
      case "RBP": return 5;
      case "RSI": return 6;
      case "RDI": return 7;
      case "R8": return 8;
      case "R9": return 9;
      case "R10": return 10;
      case "R11": return 11;
      case "R12": return 12;
      case "R13": return 13;
      case "R14": return 14;
    }
  }

  paddingHex(num, width): string {
    var result = num.toString(16);
    while (result.length < width) {
      result = '0' + result;
    } 
    return "0x" + result;
  }
}