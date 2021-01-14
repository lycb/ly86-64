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
      while(result.length < width) {
        result = 'f' + result;
      }
    } else {
      result = num.toString(16);
      while (result.length < width) {
        result = '0' + result;
      }
    }
    if (header) return "0x" + result;
    return result;
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
  }

