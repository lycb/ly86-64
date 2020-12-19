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


  /*
  * sign
  * @returns the sign of source in two's comp
  * if source is negative, return 1, else return 0
  */
  sign(source: Long): boolean {
    return source.isNegative();
  }

  addOverflow(a: Long, b: Long): boolean {
  	let sum = a.add(b),
    sumSign = this.sign(sum),
  	aSign = this.sign(a),
  	bSign = this.sign(b);
  	console.log("a: " + a)
  	console.log("sum: " + sum)
  	console.log("asign: " + aSign + " bSign: " + bSign)
  	return ((aSign == bSign) && (aSign != sumSign)); 
  }

  subOverflow(a: Long, b: Long): boolean {
  	let sub = b.subtract(a),
    subSign = this.sign(sub),
  	aSign = this.sign(a),
  	bSign = this.sign(b);
  	return ((aSign == bSign) && (aSign != subSign)); 
  }
}

