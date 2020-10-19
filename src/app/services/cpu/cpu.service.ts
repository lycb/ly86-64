import { Injectable } from "@angular/core";
import { InstructionService } from "../instruction/instruction.service";
import { ParserService } from "../parser/parser.service";
import { RegisterService } from "../register/register.service";
import { Line } from "../../models/Line";
import { MemoryFunc } from "../../models/Memory";
import { F, D, E, M, W } from "../../models/PipeReg";
import * as Constants from "../../constants";
import { Observable, Subject } from 'rxjs';

@Injectable({
	providedIn: "root",
})
export class CpuService {
	error: boolean;
	freg: F;
	f_pred = new Subject<any>();

	constructor(
		private instructionService: InstructionService,
		private parserService: ParserService,
		private RegisterService: RegisterService
	) {
		this.error = false;
	}

	getPredPC(): Observable<any> {
		return this.f_pred.asObservable();
	}

	doFetchStage(lineObject: Line, freg: F): void {
		this.freg = freg;
		this.doFetchClockLow(lineObject, freg);
		this.doFetchClockHigh();
	}

	doFetchClockLow(lineObject: Line, freg: F): void {
		const mreg = new M();
		const wreg = new W();
		let line = lineObject.parsedLine.instruction;

		let icode = 0,
			ifun = 0,
			rA = 0,
			rB = 0,
			stat = 0,
			valC = 0,
			valP = 0,
			f_predPC = 0;
		icode = parseInt(line[0], 16);
		ifun = parseInt(line[1], 16);
		let registers = this.getRegisterIds(icode, line);
		if (registers) {
			rA = registers[0];
			rB = registers[1];
		}
		let f_pc = this.selectPC(freg, mreg, wreg);
		stat = this.f_status(icode, this.error);
		icode = this.f_icode(icode, this.error);
		ifun = this.f_ifun(ifun, this.error);
		valC = this.buildValC(icode, f_pc);
		valP = this.PCincrement(f_pc, icode, valC);
		f_predPC = this.predictPC(icode, valC, valP);
		this.f_pred.next(f_predPC);

		freg.getPredPC().setInput(f_predPC);
		console.log("freg PC: " + freg.getPredPC().getOutput())

		this.setDInput(stat, icode, ifun, rA, rB, valC, valP);
	}

	doFetchClockHigh(): void {
		const freg = new F();
		const dreg = new D();

		freg.getPredPC().normal();
		dreg.getstat().normal();
		dreg.geticode().normal();
		dreg.getifun().normal();
		dreg.getrA().normal();
		dreg.getrB().normal();
		dreg.getvalC().normal();
		dreg.getvalP().normal();
	}

	setDInput(stat: number, icode: number, ifun: number, rA: number, rB: number, valC: number, valP: number): void {
		const dreg = new D();
		dreg.getstat().setInput(stat);
		dreg.geticode().setInput(icode);
		dreg.getifun().setInput(ifun);
		dreg.getrA().setInput(rA);
		dreg.getrB().setInput(rB);
		dreg.getvalC().setInput(valC);
		dreg.getvalP().setInput(valP);
		// console.log("icode: " + icode)
		// console.log("ifun: " + ifun);
		// console.log("rA: " + rA);
		// console.log("rB: " + rB);
		// console.log("valC: " + valC);
		// console.log("valP: " + valP);
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

	buildValC(icode: number, f_pc: number): number {
		return 0;
	}

	getRegisterIds(icode: number, line: string): number[] {
		if (this.needRegister(icode)) {
			const rA = parseInt(line.substring(2, 3), 16);
			const rB = parseInt(line.substring(3, 4), 16);
			if (rA <= 15 && rA >= 0 && rB <= 15 && rB >= 0) {
				return new Array(rA, rB);
			} else {
				this.error = true;
			}
		}
	}

	isInstructionValid(icode: number): boolean {
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

	f_status(icode: number, error: boolean): number {
		if (error) return Constants.SADR;
		else if (!this.isInstructionValid(icode)) return Constants.SINS;
		else if (icode == Constants.HALT) return Constants.SHLT;
		else return Constants.SAOK;
	}

	f_icode(icode: number, error: boolean): number {
		if (error) return Constants.NOP;
		else return icode;
	}

	f_ifun(ifun: number, error: boolean): number {
		if (error) return Constants.FNONE;
		else return ifun;
	}

	predictPC(icode: number, valC: number, valP: number): number {
		if (icode === Constants.JXX || icode === Constants.CALL) return valC;
		else return valP;
	}

	PCincrement(f_pc: number, icode: number, valC: number): number {
		if (this.needValC(icode)) {
			if (this.needRegister(icode)) {
				return f_pc + Constants.VALC_BYTES + Constants.REG_BYTES;
			} else {
				return f_pc + Constants.VALC_BYTES + Constants.PC_INCREMENT;
			}
		} else if (!this.needValC(icode) && this.needRegister(icode)) {
			return f_pc + Constants.REG_BYTES;
		} else {
			return f_pc + Constants.PC_INCREMENT;
		}
	}

	selectPC(freg: F, mreg: M, wreg: W): number {
		const m_icode = mreg.geticode().getOutput();
		const w_icode = wreg.geticode().getOutput();
		const m_Cnd = mreg.getCnd().getOutput();

		if (m_icode == Constants.JXX && !m_Cnd) {
			return mreg.getvalA().getOutput();
		} else if (w_icode == Constants.RET) {
			return wreg.getvalM().getOutput();
		} else {
			return freg.getPredPC().getOutput();
		}
	}
}
