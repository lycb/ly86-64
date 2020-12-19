import { Injectable } from '@angular/core';
import Long from 'long';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  /*
  * sign
  * @returns the sign of source in two's comp
  * if source is negative, return 1, else return 0
  */
  sign(source: number): boolean {
  	let bit = parseInt(source.toString(2)[0], 16);
  	if (bit == 1) return true;
  	return false;
  }

  addOverflow(a: number, b: number): boolean {
  	let sumSign = this.sign(a + b),
  	aSign = this.sign(a),
  	bSign = this.sign(b);
  	console.log("a: " + a)
  	console.log("sum: " + (a+b))
  	console.log("asign: " + aSign + " bSign: " + bSign)
  	return ((aSign == bSign) && (aSign != sumSign)); 
  }

  subOverflow(a: number, b: number): boolean {
  	let sumSign = this.sign(b - a),
  	aSign = this.sign(a),
  	bSign = this.sign(b);
  	return ((aSign == bSign) && (aSign != sumSign)); 
  }
}

