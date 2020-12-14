import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class InstructionService {

  constructor() { }

  icodeifun2instr(icode: string, ifun: string): string {
  	switch(icode) {
  		case '0': return 'HALT';
  		case '1': return 'NOP';

  		case '2': 
  			switch(ifun) {
  				case '0': return 'RRMOVQ';
  				case '1': return 'CMOVLE';
  				case '2': return 'CMOVL';
  				case '3': return 'CMOVE';
  				case '4': return 'CMOVNE';
  				case '5': return 'CMOVGE';
  				case '6': return 'CMOVG';
  			}

  		case '3': return 'IRMOVQ';
  		case '4': return 'RMMOVQ';
  		case '5': return 'MRMOVQ';

  		case '6':
  			switch(ifun) {
  				case '0': return 'ADDQ';
  				case '1': return 'SUBQ';
  				case '2': return 'ANDQ';
  				case '3': return 'XORQ';
  			}

  		case '7':
  			switch(ifun) {
  				case '0': return 'JMP';
  				case '1': return 'JLE';
  				case '2': return 'JL';
  				case '3': return 'JE';
  				case '4': return 'JNE';
  				case '5': return 'JGE';
  				case '6': return 'JG';
  			}

  		case '8': return 'CALL';
  		case '9': return 'RET';
  		case '10': return 'PUSHQ';
  		case '11': return 'POPQ';
  	}
  }
}
