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
    dreg: D;
    ereg: E;
    mreg: M;
    wreg: W;

    d_reg = new Subject<D>();
    e_reg = new Subject<E>();
    f_pred = new Subject<any>();

    constructor(
        private instructionService: InstructionService,
        private parserService: ParserService,
        private RegisterService: RegisterService
        ) {
        this.error = false;
    }

    // FETCH

    doSimulation(lineObject: Line, freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {
        this.freg = freg;
        this.dreg = dreg;
        this.ereg = ereg;
        this.mreg = mreg;
        this.wreg = wreg;

        this.doExecuteStage(lineObject, freg, dreg, ereg, mreg, wreg);
        this.doDecodeStage(lineObject, freg, dreg, ereg, mreg, wreg);
        this.e_reg.next(ereg);
        this.doFetchStage(lineObject, freg, dreg, ereg, mreg, wreg);
        this.d_reg.next(dreg);
    }

    doFetchStage(lineObject: Line, freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {
        this.freg = freg;
        this.dreg = dreg;
        this.ereg = ereg;
        this.mreg = mreg;
        this.wreg = wreg;

        this.doFetchClockLow(lineObject, freg, dreg, ereg, mreg, wreg);
        this.doFetchClockHigh(freg, dreg);
    }

    doFetchClockLow(lineObject: Line, freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {
        let line = lineObject.parsedLine.instruction;

        let icode = 0,
        ifun = 0,
        rA = Constants.RNONE,
        rB = Constants.RNONE,
        stat = Constants.SAOK,
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
        valC = this.getValC(icode, f_pc, line);
        valP = this.PCincrement(f_pc, icode, valC);
        f_predPC = this.predictPC(icode, valC, valP);

        // setting Observable to read for pipeline register
        this.f_pred.next(f_predPC.toString(16));

        freg.getPredPC().setInput(f_predPC);

        this.setDInput(dreg, stat, icode, ifun, rA, rB, valC, valP);
    }

    doFetchClockHigh(freg: F, dreg: D): void {
        freg.getPredPC().normal();
        dreg.getstat().normal();
        dreg.geticode().normal();
        dreg.getifun().normal();
        dreg.getrA().normal();
        dreg.getrB().normal();
        dreg.getvalC().normal();
        dreg.getvalP().normal();
    }

    getPredPC(): Observable<any> {
        return this.f_pred.asObservable();
    }

    setDInput(dreg: D, stat: number, icode: number, ifun: number, rA: number, rB: number, valC: number, valP: number): void {
        dreg.getstat().setInput(stat);
        dreg.geticode().setInput(icode);
        dreg.getifun().setInput(ifun);
        dreg.getrA().setInput(rA);
        dreg.getrB().setInput(rB);
        dreg.getvalC().setInput(valC);
        dreg.getvalP().setInput(valP);
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

    getValC(icode: number, f_pc: number, line: string): number {
        let memory = MemoryFunc.getInstance();
        let arr = new Array<number>(8);
        if (this.needValC(icode)) {
            if (!this.needRegister(icode)) {
                let index = 0;
                for (let i = f_pc + 1; index < 8; i++) {
                    arr[index] = memory.getByte(i);
                    index++;
                }
                return this.buildLong(arr);
            } else {
                let index = 0;
                for (let i = f_pc + 2; index < 8; i++) {
                    arr[index] = memory.getByte(i);
                    index++;
                }
                return this.buildLong(arr);
            }
        }
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

    resetValues(freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {
        this.f_pred.next(0);
        freg.getPredPC().setInput(0);
        freg.getPredPC().normal();
    }

    buildLong(arr: number[]): number {
        let ret = 0;
        for(let i = 6; i >= 0; i--)
        {
            ret = ret<<8;
            ret += arr[i];
        }
        return ret;
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

    // DECODE

    doDecodeStage(lineObject: Line, freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {
        this.freg = freg;
        this.dreg = dreg;
        this.ereg = ereg;
        this.mreg = mreg;
        this.wreg = wreg;

        this.d_reg.next(dreg);

        this.doDecodeClockLow(lineObject, freg, dreg, ereg, mreg, wreg);
        this.doDecodeClockHigh(ereg);
    }

    doDecodeClockLow(lineObject: Line, freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {

        let line = lineObject.parsedLine.instruction;

        let icode = 0,
        ifun = 0,
        stat = 0,
        valA = 0,
        valB = 0,
        valC = dreg.getvalC().getOutput(),
        dstE = Constants.RNONE,
        dstM = Constants.RNONE,
        srcA = Constants.RNONE,
        srcB = Constants.RNONE;
        

        stat = dreg.getstat().getOutput();
        icode = dreg.geticode().getOutput();
        ifun = dreg.getifun().getOutput();
        valC = dreg.getvalC().getOutput();

        this.setEInput(ereg, stat, icode, ifun, valC, valA, valB, dstE, dstM, srcA, srcB);
    }

    doDecodeClockHigh(ereg: E): void {
        ereg.getstat().normal();
        ereg.geticode().normal();
        ereg.getifun().normal();
        ereg.getvalC().normal();
        ereg.getvalA().normal();
        ereg.getvalB().normal();
        ereg.getdstE().normal();
        ereg.getdstM().normal();
        ereg.getsrcA().normal();
        ereg.getsrcB().normal();
    }

    setEInput(ereg: E, stat: number, icode: number, ifun: number, valC: number, valA: number, 
        valB: number, dstE: number, dstM: number, srcA: number, srcB: number): void {
        ereg.getstat().setInput(stat);
        ereg.geticode().setInput(icode);
        ereg.getifun().setInput(ifun);
        ereg.getvalA().setInput(valA);
        ereg.getvalB().setInput(valB);
        ereg.getvalC().setInput(valC);
        ereg.getdstE().setInput(dstE);
        ereg.getdstM().setInput(dstM);
        ereg.getsrcA().setInput(srcA);
        ereg.getsrcB().setInput(srcB);
    }

    getDreg(): Observable<D> {
        return this.d_reg.asObservable();
    }

    //  EXECUTE 

    doExecuteStage(lineObject: Line, freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {
        this.freg = freg;
        this.dreg = dreg;
        this.ereg = ereg;
        this.mreg = mreg;
        this.wreg = wreg;

        this.e_reg.next(ereg);

        this.doExecuteClockLow(lineObject, freg, dreg, ereg, mreg, wreg);
        this.doExecuteClockHigh(mreg);
    }

    doExecuteClockLow(lineObject: Line, freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void { 
        
    }

    doExecuteClockHigh(mreg: M): void {
    }

    setMInput(mreg: M) {
        // mreg.getstat().setInput(stat);
        // mreg.geticode().setInput(icode);
        // mreg.getifun().setInput(ifun);
        // mreg.getvalA().setInput(valA);
        // mreg.getvalB().setInput(valB);
        // mreg.getvalC().setInput(valC);
        // mreg.getdstE().setInput(dstE);
        // mreg.getdstM().setInput(dstM);
        // mreg.getsrcA().setInput(srcA);
        // mreg.getsrcB().setInput(srcB);
    }

    getEreg(): Observable<E> {
        return this.e_reg.asObservable();
    }
}
