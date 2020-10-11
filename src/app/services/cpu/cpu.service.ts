import { Injectable } from "@angular/core";
import { InstructionService } from "../instruction/instruction.service";
import { ParserService } from "../parser/parser.service";
import { RegisterService } from "../register/register.service";
import { Line } from "../../models/Line";
import * as Constants from "../../constants";

@Injectable({
	providedIn: "root",
})
export class CpuService {
	error: boolean;

	constructor(
		private instructionService: InstructionService,
		private parserService: ParserService,
		private RegisterService: RegisterService
	) {
		this.error = false;
	}

	doFetchStage(line: string): void {
		let icode = 0,
			ifun = 0,
			rA = 0,
			rB = 0,
			stat = 0,
			valC = 0,
			valP = 0;
		icode = parseInt(line[0], 16);
		ifun = parseInt(line[1], 16);
		let registers = this.getRegisterIds(icode, line);
		if (registers) {
			rA = registers[0];
			rB = registers[1];
		}
		stat = this.f_status(icode, this.error);
	}

	needRegister(icode: number): boolean {
		return (
			icode == Constants.RRMOVQ ||
			icode == Constants.OPQ ||
			icode == Constants.PUSHQ ||
			icode == Constants.POPQ ||
			icode == Constants.IRMOVQ ||
			icode == Constants.RMMOVQ ||
			icode == Constants.MRMOVQ
		);
	}

	needValC(icode: number): boolean {
		return (
			icode == Constants.IRMOVQ ||
			icode == Constants.RMMOVQ ||
			icode == Constants.MRMOVQ ||
			icode == Constants.JXX ||
			icode == Constants.CALL
		);
	}

	getRegisterIds(icode: number, line: string) {
		if (this.needRegister(icode)) {
			let rA = parseInt(line.substring(2, 3), 16);
			let rB = parseInt(line.substring(3, 4), 16);
			if (rA <= 15 && rA >= 0 && rB <= 15 && rB >= 0) {
				return new Array(rA, rB);
			} else {
				this.error = true;
			}
		}
	}

	isInstructionValid(icode: number) {
		return (
			icode == Constants.NOP ||
			icode == Constants.HALT ||
			icode == Constants.RRMOVQ ||
			icode == Constants.IRMOVQ ||
			icode == Constants.RMMOVQ ||
			icode == Constants.MRMOVQ ||
			icode == Constants.OPQ ||
			icode == Constants.JXX ||
			icode == Constants.CALL ||
			icode == Constants.RET ||
			icode == Constants.PUSHQ ||
			icode == Constants.POPQ
		);
	}

	f_status(icode: number, error: boolean) {
		if (error) return Constants.SADR;
		else if (!this.isInstructionValid(icode)) return Constants.SINS;
		else if (icode == Constants.HALT) return Constants.SHLT;
		else return Constants.SAOK;
	}
}
