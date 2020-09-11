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
  			value: new Long(0,0)
  		});
	  }
	  console.log(this.register)
	}

  getRegisters(): Register[] {
  	return this.register;
  }
}
