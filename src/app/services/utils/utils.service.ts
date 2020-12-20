import { Injectable } from '@angular/core';
import Long from 'long';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  buildLong(arr: Long[]): Long {
    let ret = Long.ZERO;
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
    console.log(temp)
    if (temp[0] == '0') return false;
    else return true;
  }

  addOverflow(a: Long, b: Long): boolean {
    let sum = a.add(b),
      sumSign = this.sign(sum.toString(2)),
      aSign = this.sign(a.toString(2)),
      bSign = this.sign(b.toString(2));
    console.log("a: " + a.toString(16))
    console.log("b: " + b.toString(16))
    console.log("sum: " + sum)
    console.log("asign: " + aSign + " bSign: " + bSign + " Sum: " + sumSign)
    return ((aSign == bSign) && (aSign != sumSign));
  }

  subOverflow(a: Long, b: Long): boolean {
    let sub = b.subtract(a),
      subSign = this.sign(sub.toString(2)),
      aSign = this.sign(a.toString(2)),
      bSign = this.sign(b.toString(2));
    return ((aSign == bSign) && (aSign != subSign));
  }

  paddingHex(num, width): string {
    var result = num.toString(16);
    while (result.length < width) {
      result = '0' + result;
    }
    return "0x" + result;
  }

  paddingBinary(num, width): string {
    var result = num.toString(2);
    while (result.length < width) {
      result = '0' + result;
    }
    return result;
  }
}

