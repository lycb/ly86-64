import { Injectable } from '@angular/core';
import Long from 'long';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  buildLong(arr: Long[]): Long {
    let ret = arr[7];
    for (let i = 6; i >= 0; i--) {
      ret = ret.shiftLeft(8);
      ret = ret.add(arr[i]);
    }
    return ret;
  }

  getByte(source: Long, byteNum: number): Long {
    if (byteNum > 7 || byteNum < 0) {
      return Long.ZERO;
    }
    let m = new Long(0xff, 0),
      ret = source;

    ret = ret.shiftRight(Long.fromNumber((8 * byteNum)));
    ret = ret.and(m);
    return ret;
  }

  /*
  * sign
  * @returns the sign of source in two's comp
  * if source is negative, return 1, else return 0
  */
  sign(source: string): boolean {
    let temp = this.paddingBinary(source, 64);
    if (temp[0] == '0') return false;
    else return true;
  }

  addOverflow(a: Long, b: Long): boolean {
    let sum = (a.add(b)).toSigned(),
      sumSign = sum.isNegative(),
      aSign = this.sign(a.toString(2)),
      bSign = this.sign(b.toString(2));
    return ((aSign == bSign) && (aSign != sumSign));
  }

  subOverflow(a: Long, b: Long): boolean {
    let sub = (b.subtract(a)).toSigned(),
      subSign = sub.isNegative(),
      aSign = this.sign(a.toString(2)),
      bSign = this.sign(b.toString(2));
    return ((aSign != bSign) && (aSign == subSign));
  }

  /*
  * paddingHex
  * pad any hex number to a specified width
  * 
  * for example:
  * paddingHex(12, 8) returns 0x0000000c
  */
  paddingHex(num, width, header: boolean): string {
    let result;
    if (num < 0) {
      result = (num >>> 0).toString(16);
      while (result.length < width) {
        result = 'f' + result;
      }
    } else {
      result = num.toString(16);
      while (result.length < width) {
        result = '0' + result;
      }
    }
    if (header) return "0x" + result;
    else return result;
  }


  /*
  * paddingBinary
  * pad any binary number to a specified width
  * 
  * for example:
  * paddingBinary(12, 8) returns 00001100
  */
  paddingBinary(num, width): string {
    let result;
    if (num < 0) {
      result = (num >>> 0).toString(2);

      while (result.length > width) {
        result = result.slice(1);
      }
    } else {
      result = num.toString(2);
      while (result.length < width) {
        result = '0' + result;
      }
    }
    return result;
  }

  register2index(name: string): number {
    switch (name) {
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
      default: return 0xf;
    }
  }

  index2register(index: number): string {
    switch (index) {
      case 0: return 'RAX';
      case 1: return 'RCX';
      case 2: return 'RDX';
      case 3: return 'RBX';
      case 4: return 'RSP';
      case 5: return 'RBP';
      case 6: return 'RSI';
      case 7: return 'RDI';
      case 8: return 'R8';
      case 9: return 'R9';
      case 10: return 'R10';
      case 11: return 'R11';
      case 12: return 'R12';
      case 13: return 'R13';
      case 14: return 'R14';
      default: return 'RNONE';
    }
  }

  icodeifun2instr(icode: number, ifun: number): string {
    switch(icode) {
      case 0: return 'HALT';
      case 1: return 'NOP';

      case 2: 
        switch(ifun) {
          case 0: return 'RRMOVQ';
          case 1: return 'CMOVLE';
          case 2: return 'CMOVL';
          case 3: return 'CMOVE';
          case 4: return 'CMOVNE';
          case 5: return 'CMOVGE';
          case 6: return 'CMOVG';
        }

      case 3: return 'IRMOVQ';
      case 4: return 'RMMOVQ';
      case 5: return 'MRMOVQ';

      case 6:
        switch(ifun) {
          case 0: return 'ADDQ';
          case 1: return 'SUBQ';
          case 2: return 'ANDQ';
          case 3: return 'XORQ';
        }

      case 7:
        switch(ifun) {
          case 0: return 'JMP';
          case 1: return 'JLE';
          case 2: return 'JL';
          case 3: return 'JE';
          case 4: return 'JNE';
          case 5: return 'JGE';
          case 6: return 'JG';
        }

      case 8: return 'CALL';
      case 9: return 'RET';
      case 10: return 'PUSHQ';
      case 11: return 'POPQ';
      default: return 'INVALID';
    }
  }

  icode2instr(icode: number): string {
    switch(icode) {
      case 0: return 'HALT';
      case 1: return 'NOP';
      case 2: return 'CMOVXX';
      case 3: return 'IRMOVQ';
      case 4: return 'RMMOVQ';
      case 5: return 'MRMOVQ';
      case 6: return 'OPQ';
      case 7: return 'JXX';
      case 8: return 'CALL';
      case 9: return 'RET';
      case 10: return 'PUSHQ';
      case 11: return 'POPQ';
      default: return 'INVALID';
    }
  }

  num2stat(stat: number): string {
    switch(stat) {
      case 1: return 'SAOK';
      case 2: return 'SADR';
      case 3: return 'SINS';
      case 4: return 'SHLT';
    }
  }
}

