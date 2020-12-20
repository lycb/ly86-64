import { Injectable } from "@angular/core";
import { InstructionService } from "../instruction/instruction.service";
import { ParserService } from "../parser/parser.service";
import { RegisterService } from "../register/register.service";
import { ConditionCodesService } from "../condition-codes/condition-codes.service";
import { UtilsService } from "../utils/utils.service";
import { Line } from "../../models/Line";
import { MemoryFunc } from "../../models/Memory";
import { F, D, E, M, W } from "../../models/PipeReg";
import * as Constants from "../../constants";
import Long from 'long';
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

    // Observables for passing values to the pipeline register component
    f_pred = new Subject<any>();
    d_reg = new Subject<D>();
    e_reg = new Subject<E>();
    m_reg = new Subject<M>();
    w_reg = new Subject<W>();

    // Stalling, bubbling logic variables
    fstall: boolean;
    dstall: boolean;

    dbubble: boolean;
    ebubble: boolean;

    mbubble: boolean;

    // Global variables for passing in between stages
    D_srcA: Long;
    D_srcB: Long;

    E_dstE: Long;
    E_valE: Long;
    E_Cnd: Long;

    M_valM: Long;
    M_stat: Long;

    constructor(
        private instructionService: InstructionService,
        private parserService: ParserService,
        private registerService: RegisterService,
        private conditionCodesService: ConditionCodesService,
        private utilsService: UtilsService
    ) {
        this.error = false;
    }

    /*
    * doSimulation
    * performs simulation for the pipeline
    */
    doSimulation(lineObject: Line, freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {
        this.freg = freg;
        this.dreg = dreg;
        this.ereg = ereg;
        this.mreg = mreg;
        this.wreg = wreg;

        this.doWritebackStage(wreg);
        this.w_reg.next(wreg); // for subscribe timing
        this.doMemoryStage(lineObject, freg, dreg, ereg, mreg, wreg);
        this.doExecuteStage(lineObject, freg, dreg, ereg, mreg, wreg);
        this.m_reg.next(mreg);
        this.doDecodeStage(lineObject, freg, dreg, ereg, mreg, wreg);
        this.e_reg.next(ereg);
        this.doFetchStage(lineObject, freg, dreg, ereg, mreg, wreg);
        this.d_reg.next(dreg);
    }

    /*
    * ==============================================================
    *                    F E T C H     S T A G E
    * ==============================================================
    */

    /*
    * doFetchStage
    * performs clock low and clock high for the fetch stage
    */
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

        let icode = Long.ZERO,
            ifun = Long.ZERO,
            rA = Long.fromNumber(Constants.RNONE),
            rB = Long.fromNumber(Constants.RNONE),
            stat = Long.fromNumber(Constants.SAOK),
            valC = Long.ZERO,
            valP = Long.ZERO,
            f_predPC = Long.ZERO;

        icode = Long.fromString(line[0], 16);
        ifun = Long.fromString(line[1], 16);
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
        valP = Long.fromNumber(this.PCincrement(f_pc, icode));
        f_predPC = this.predictPC(icode, valC, valP);

        this.f_calculateControlSignals(dreg, ereg, mreg);

        // setting Observable to read for pipeline register
        this.f_pred.next(f_predPC.toString(16));
        freg.getPredPC().setInput(f_predPC);

        this.setDInput(dreg, stat, icode, ifun, rA, rB, valC, valP);
    }

    doFetchClockHigh(freg: F, dreg: D): void {
        if (!this.fstall) {
            freg.getPredPC().normal();
        }
        if (this.dbubble) {
            dreg.getstat().bubble(Long.fromNumber(Constants.SAOK));
            dreg.geticode().bubble(Long.fromNumber(Constants.NOP));
            dreg.getifun().bubble(Long.ZERO);
            dreg.getrA().bubble(Long.fromNumber(Constants.RNONE));
            dreg.getrB().bubble(Long.fromNumber(Constants.RNONE));
            dreg.getvalC().bubble(Long.ZERO);
            dreg.getvalP().bubble(Long.ZERO);
        }
        if (!this.dbubble && !this.dstall) {
            dreg.getstat().normal();
            dreg.geticode().normal();
            dreg.getifun().normal();
            dreg.getrA().normal();
            dreg.getrB().normal();
            dreg.getvalC().normal();
            dreg.getvalP().normal();
        }
    }

    setDInput(dreg: D, stat: Long, icode: Long, ifun: Long, rA: Long, rB: Long, valC: Long, valP: Long): void {
        dreg.getstat().setInput(stat);
        dreg.geticode().setInput(icode);
        dreg.getifun().setInput(ifun);
        dreg.getrA().setInput(rA);
        dreg.getrB().setInput(rB);
        dreg.getvalC().setInput(valC);
        dreg.getvalP().setInput(valP);
    }

    needRegister(icode: Long): boolean {
        return (
            icode.equals(Long.fromNumber(Constants.RRMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.OPQ)) ||
            icode.equals(Long.fromNumber(Constants.PUSHQ)) ||
            icode.equals(Long.fromNumber(Constants.POPQ)) ||
            icode.equals(Long.fromNumber(Constants.IRMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.RMMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.MRMOVQ))
        );
    }

    needValC(icode: Long): boolean {
        return (
            icode.equals(Long.fromNumber(Constants.IRMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.RMMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.MRMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.JXX)) ||
            icode.equals(Long.fromNumber(Constants.CALL))
        );
    }

    getValC(icode: Long, f_pc: Long, line: string): Long {
        let memory = MemoryFunc.getInstance(this.utilsService);
        let arr = new Array<Long>(8);
        if (this.needValC(icode)) {
            if (!this.needRegister(icode)) {
                let index = 0;
                for (let i = f_pc.toNumber() + 1; index < 8; i++) {
                    arr[index] = memory.getByte(i);
                    index++;
                }
                return this.utilsService.buildLong(arr);
            } else {
                let index = 0;
                for (let i = f_pc.toNumber() + 2; index < 8; i++) {
                    arr[index] = memory.getByte(i);
                    index++;
                }
                return this.utilsService.buildLong(arr);
            }
        }
        return Long.ZERO;
    }

    getRegisterIds(icode: Long, line: string): Long[] {
        if (this.needRegister(icode)) {
            const rA = Long.fromString(line.substring(2, 3), 16);
            const rB = Long.fromString(line.substring(3, 4), 16);
            if (rA.lessThanOrEqual(15) && rA.greaterThanOrEqual(0) && rB.lessThanOrEqual(15) && rB.greaterThanOrEqual(0)) {
                return new Array<Long>(rA, rB);
            } else {
                this.error = true;
            }
        }
    }

    f_status(icode: Long, error: boolean): Long {
        if (error) return Long.fromNumber(Constants.SADR);
        else if (!this.isInstructionValid(icode)) return Long.fromNumber(Constants.SINS);
        else if (icode.equals(Long.fromNumber(Constants.HALT))) return Long.fromNumber(Constants.SHLT);
        else return Long.fromNumber(Constants.SAOK);
    }

    f_icode(icode: Long, error: boolean): Long {
        if (error) return Long.fromNumber(Constants.NOP);
        else return icode;
    }

    f_ifun(ifun: Long, error: boolean): Long {
        if (error) return Long.fromNumber(Constants.FNONE);
        else return ifun;
    }

    predictPC(icode: Long, valC: Long, valP: Long): Long {
        if (icode.equals(Long.fromNumber(Constants.JXX)) ||
            icode.equals(Long.fromNumber(Constants.CALL))) return valC;
        else return valP;
    }

    PCincrement(f_pc: Long, icode: Long): number {
        if (this.needValC(icode)) {
            if (this.needRegister(icode)) {
                return f_pc.toNumber() + Constants.VALC_BYTES + Constants.REG_BYTES;
            } else {
                return f_pc.toNumber() + Constants.VALC_BYTES + Constants.PC_INCREMENT;
            }
        } else if (!this.needValC(icode) && this.needRegister(icode)) {
            return f_pc.toNumber() + Constants.REG_BYTES;
        } else {
            return f_pc.toNumber() + Constants.PC_INCREMENT;
        }
    }

    selectPC(freg: F, mreg: M, wreg: W): Long {
        const m_icode = mreg.geticode().getOutput();
        const w_icode = wreg.geticode().getOutput();
        const m_Cnd = mreg.getCnd().getOutput();

        if (m_icode.equals(Long.fromNumber(Constants.JXX)) && !m_Cnd) {
            return mreg.getvalA().getOutput();
        } else if (w_icode.equals(Long.fromNumber(Constants.RET))) {
            return wreg.getvalM().getOutput();
        } else {
            return freg.getPredPC().getOutput();
        }
    }

    resetValues(freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {
        this.f_pred.next("0");
        freg.getPredPC().setInput(Long.ZERO);
        freg.getPredPC().normal();
    }

    isInstructionValid(icode: Long): boolean {
        return (
            icode.equals(Long.fromNumber(Constants.NOP)) ||
            icode.equals(Long.fromNumber(Constants.HALT)) ||
            icode.equals(Long.fromNumber(Constants.RRMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.IRMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.RMMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.MRMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.OPQ)) ||
            icode.equals(Long.fromNumber(Constants.JXX)) ||
            icode.equals(Long.fromNumber(Constants.CALL)) ||
            icode.equals(Long.fromNumber(Constants.RET)) ||
            icode.equals(Long.fromNumber(Constants.PUSHQ)) ||
            icode.equals(Long.fromNumber(Constants.POPQ))
        );
    }

    /*
    * F_stall
    * stalling logic for F register
    */
    f_stall(dreg: D, ereg: E, mreg: M): boolean {
        let e_icode = ereg.geticode().getOutput(),
            d_icode = dreg.geticode().getOutput(),
            m_icode = mreg.geticode().getOutput(),
            e_dstM = ereg.getdstM().getOutput();

        return ((e_icode.equals(Long.fromNumber(Constants.MRMOVQ)) ||
            e_icode.equals(Long.fromNumber(Constants.POPQ)) &&
            (e_dstM.equals(this.D_srcA) || e_dstM.equals(this.D_srcB))) ||
            (e_icode.equals(Long.fromNumber(Constants.RET)) ||
                d_icode.equals(Long.fromNumber(Constants.RET)) ||
                m_icode.equals(Long.fromNumber(Constants.RET))));
    }

    /*
    * D_stall
    * stalling logic for D register
    */
    d_stall(ereg: E): boolean {
        let e_icode = ereg.geticode().getOutput(),
            e_dstM = ereg.getdstM().getOutput();

        return (e_icode.equals(Long.fromNumber(Constants.MRMOVQ)) ||
            e_icode.equals(Long.fromNumber(Constants.POPQ))) &&
            (e_dstM.equals(this.D_srcA) || e_dstM.equals(this.D_srcB));
    }

    d_bubble(dreg: D, ereg: E, mreg: M): boolean {
        let e_icode = ereg.geticode().getOutput(),
            d_icode = dreg.geticode().getOutput(),
            m_icode = mreg.geticode().getOutput(),
            e_dstM = ereg.getdstM().getOutput(),
            Cnd = this.E_Cnd;

        return (e_icode.equals(Long.fromNumber(Constants.JXX)) && !Cnd) ||
            (!((e_icode.equals(Long.fromNumber(Constants.MRMOVQ)) ||
                e_icode.equals(Long.fromNumber(Constants.POPQ))) &&
                (e_dstM.equals(this.D_srcA) ||
                    e_dstM.equals(this.D_srcB))) &&
                (e_icode.equals(Long.fromNumber(Constants.RET)) ||
                    d_icode.equals(Long.fromNumber(Constants.RET)) ||
                    m_icode.equals(Long.fromNumber(Constants.RET))));
    }

    f_calculateControlSignals(dreg: D, ereg: E, mreg: M): void {
        this.fstall = this.f_stall(dreg, ereg, mreg);
        this.dstall = this.d_stall(ereg);
        this.dbubble = this.d_bubble(dreg, ereg, mreg);
    }

    /*
    * getPredPC
    * @returns an Observable of type <any> for the predPC 
    * to pass to the F pipeline register
    */
    getPredPC(): Observable<any> {
        return this.f_pred.asObservable();
    }

    /*
    * ==============================================================
    *                    D E C O D E     S T A G E
    * ==============================================================
    */

    doDecodeStage(lineObject: Line, freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {
        this.freg = freg;
        this.dreg = dreg;
        this.ereg = ereg;
        this.mreg = mreg;
        this.wreg = wreg;

        this.doDecodeClockLow(lineObject, freg, dreg, ereg, mreg, wreg);
        this.doDecodeClockHigh(ereg);
    }

    doDecodeClockLow(lineObject: Line, freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {

        let line = lineObject.parsedLine.instruction;

        this.D_srcA = this.set_D_srcA(dreg);
        this.D_srcB = this.set_D_srcB(dreg);

        let icode = dreg.geticode().getOutput(),
            ifun = dreg.getifun().getOutput(),
            stat = dreg.getstat().getOutput(),
            valA = this.d_valA(dreg, mreg, wreg),
            valB = this.d_valB(mreg, wreg),
            valC = dreg.getvalC().getOutput(),
            dstE = this.d_dstE(dreg),
            dstM = this.d_dstM(dreg);

        this.d_calculateControlSignals(ereg);

        this.setEInput(ereg, stat, icode, ifun, valC, valA, valB, dstE, dstM, this.D_srcA, this.D_srcB);
    }

    doDecodeClockHigh(ereg: E): void {
        if (this.ebubble) {
            ereg.getstat().bubble(Long.fromNumber(Constants.SAOK));
            ereg.geticode().bubble(Long.fromNumber(Constants.NOP));
            ereg.getifun().bubble(Long.ZERO);
            ereg.getvalC().bubble(Long.ZERO);
            ereg.getvalA().bubble(Long.ZERO);
            ereg.getvalB().bubble(Long.ZERO);
            ereg.getdstE().bubble(Long.fromNumber(Constants.RNONE));
            ereg.getdstM().bubble(Long.fromNumber(Constants.RNONE));
            ereg.getsrcA().bubble(Long.fromNumber(Constants.RNONE));
            ereg.getsrcB().bubble(Long.fromNumber(Constants.RNONE));
        } else {
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
    }

    setEInput(ereg: E, stat: Long, icode: Long, ifun: Long, valC: Long, valA: Long,
        valB: Long, dstE: Long, dstM: Long, srcA: Long, srcB: Long): void {
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

    set_D_srcA(dreg: D): Long {
        let icode = dreg.geticode().getOutput(),
            rA = dreg.getrA().getOutput();

        if (icode.equals(Long.fromNumber(Constants.RRMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.RMMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.OPQ)) ||
            icode.equals(Long.fromNumber(Constants.PUSHQ))) {
            return rA;
        }
        if (icode.equals(Long.fromNumber(Constants.POPQ)) ||
            icode.equals(Long.fromNumber(Constants.RET))) {
            return Long.fromNumber(Constants.RSP);
        }
        return Long.fromNumber(Constants.RNONE);
    }

    set_D_srcB(dreg: D): Long {
        let icode = dreg.geticode().getOutput(),
            rB = dreg.getrB().getOutput();

        if (icode.equals(Long.fromNumber(Constants.OPQ)) ||
            icode.equals(Long.fromNumber(Constants.RMMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.MRMOVQ))) {
            return rB;
        }
        if (icode.equals(Long.fromNumber(Constants.PUSHQ)) ||
            icode.equals(Long.fromNumber(Constants.POPQ)) ||
            icode.equals(Long.fromNumber(Constants.CALL)) ||
            icode.equals(Long.fromNumber(Constants.RET))) {
            return Long.fromNumber(Constants.RSP);
        }
        return Long.fromNumber(Constants.RNONE);
    }

    d_valA(dreg: D, mreg: M, wreg: W): Long {
        let icode = dreg.geticode().getOutput();

        if (icode.equals(Long.fromNumber(Constants.CALL)) ||
            icode.equals(Long.fromNumber(Constants.JXX))) {
            return dreg.getvalP().getOutput();
        }
        if (this.D_srcA.equals(Long.fromNumber(Constants.RNONE))) {
            return Long.ZERO;
        }
        if (this.D_srcA.equals(this.E_dstE)) {
            return this.E_valE;
        }
        if (this.D_srcA.equals(mreg.getdstM().getOutput())) {
            return this.M_valM;
        }
        if (this.D_srcA.equals(mreg.getdstE().getOutput())) {
            return mreg.getvalE().getOutput();
        }
        if (this.D_srcA.equals(wreg.getdstM().getOutput())) {
            return wreg.getvalE().getOutput();
        }
        if (this.D_srcA.equals(wreg.getdstE().getOutput())) {
            return wreg.getvalE().getOutput();
        }

        let register = this.registerService.index2register(this.D_srcA.toNumber())
        return this.registerService.getValueByRegister(register);
    }

    d_valB(mreg: M, wreg: W): Long {
        if (this.D_srcB.equals(Long.fromNumber(Constants.RNONE))) {
            return Long.ZERO;
        }
        if (this.D_srcB.equals(this.E_dstE)) {
            return this.E_valE;
        }
        if (this.D_srcB.equals(mreg.getdstM().getOutput())) {
            return this.M_valM;
        }
        if (this.D_srcB.equals(mreg.getdstE().getOutput())) {
            return mreg.getvalE().getOutput();
        }
        if (this.D_srcB.equals(wreg.getdstM().getOutput())) {
            return wreg.getvalM().getOutput();
        }
        if (this.D_srcB.equals(wreg.getdstE().getOutput())) {
            return wreg.getvalE().getOutput();
        }

        let register = this.registerService.index2register(this.D_srcB.toNumber());
        return this.registerService.getValueByRegister(register);
    }

    d_dstE(dreg: D): Long {
        let icode = dreg.geticode().getOutput(),
            rB = dreg.getrB().getOutput();

        if (icode.equals(Long.fromNumber(Constants.OPQ)) ||
            icode.equals(Long.fromNumber(Constants.RRMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.IRMOVQ))) {
            return rB;
        }
        if (icode.equals(Long.fromNumber(Constants.PUSHQ)) ||
            icode.equals(Long.fromNumber(Constants.POPQ)) ||
            icode.equals(Long.fromNumber(Constants.CALL)) ||
            icode.equals(Long.fromNumber(Constants.RET))) {
            return Long.fromNumber(Constants.RSP);
        }
        return Long.fromNumber(Constants.RNONE);
    }

    d_dstM(dreg: D): Long {
        let icode = dreg.geticode().getOutput(),
            rA = dreg.getrA().getOutput();

        if (icode.equals(Long.fromNumber(Constants.POPQ)) ||
            icode.equals(Long.fromNumber(Constants.MRMOVQ))) {
            return rA;
        }
        return Long.fromNumber(Constants.RNONE);
    }

    d_calculateControlSignals(ereg: E): void {
        let e_dstM = ereg.getdstM().getOutput(),
            e_icode = ereg.geticode().getOutput();
        this.ebubble = ((e_icode.equals(Long.fromNumber(Constants.JXX)) && !this.E_Cnd) ||
            ((e_icode.equals(Long.fromNumber(Constants.MRMOVQ)) || e_icode.equals(Long.fromNumber(Constants.POPQ))) &&
                (e_dstM.equals(this.D_srcA) || e_dstM.equals(this.D_srcB))));
    }

    /*
    * getDreg
    * @returns an Observable of type <D> for the dreg 
    * to pass to the D pipeline register
    */
    getDreg(): Observable<D> {
        return this.d_reg.asObservable();
    }

    /*
    * ==============================================================
    *                    E X E C U T E     S T A G E
    * ==============================================================
    */

    doExecuteStage(lineObject: Line, freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {
        this.freg = freg;
        this.dreg = dreg;
        this.ereg = ereg;
        this.mreg = mreg;
        this.wreg = wreg;

        this.doExecuteClockLow(lineObject, freg, dreg, ereg, mreg, wreg);
        this.doExecuteClockHigh(mreg);
    }

    doExecuteClockLow(lineObject: Line, freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {
        let line = lineObject.parsedLine.instruction;

        let icode = ereg.geticode().getOutput(),
            ifun = ereg.getifun().getOutput(),
            stat = ereg.getstat().getOutput(),
            valA = ereg.getvalA().getOutput(),
            dstM = ereg.getdstM().getOutput();

        this.E_Cnd = this.get_E_Cnd(icode, ifun);
        this.E_dstE = this.set_E_dstE(ereg);
        this.E_valE = this.chooseValE(ereg, wreg);

        this.e_calculateControlSignals(wreg);

        this.setMInput(mreg, icode, this.E_Cnd, stat, this.E_valE, valA, this.E_dstE, dstM);
    }

    /*
    * doExecuteClockHigh
    * applies to appropriate control signals to the M register
    */
    doExecuteClockHigh(mreg: M): void {
        if (!this.mbubble) {
            mreg.getstat().normal();
            mreg.geticode().normal();
            mreg.getCnd().normal();
            mreg.getvalE().normal();
            mreg.getvalA().normal();
            mreg.getdstE().normal();
            mreg.getdstM().normal();
        } else {
            mreg.getstat().bubble(Long.fromNumber(Constants.SAOK));
            mreg.geticode().bubble(Long.fromNumber(Constants.NOP));
            mreg.getCnd().bubble(Long.ZERO);
            mreg.getvalE().bubble(Long.ZERO);
            mreg.getvalA().bubble(Long.ZERO);
            mreg.getdstE().bubble(Long.fromNumber(Constants.RNONE));
            mreg.getdstM().bubble(Long.fromNumber(Constants.RNONE));
        }
    }

    setMInput(mreg: M, icode: Long, Cnd: Long, stat: Long, valE: Long, valA: Long,
        dstE: Long, dstM: Long) {
        mreg.getstat().setInput(stat);
        mreg.geticode().setInput(icode);
        mreg.getCnd().setInput(Cnd);
        mreg.getvalA().setInput(valA);
        mreg.getvalE().setInput(valE);
        mreg.getdstE().setInput(dstE);
        mreg.getdstM().setInput(dstM);
    }

    alu_A(ereg: E): Long {
        let icode = ereg.geticode().getOutput();
        if (icode.equals(Long.fromNumber(Constants.RRMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.OPQ))) {
            return ereg.getvalA().getOutput();
        }
        if (icode.equals(Long.fromNumber(Constants.IRMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.RMMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.MRMOVQ))) {
            return ereg.getvalC().getOutput();
        }
        if (icode.equals(Long.fromNumber(Constants.CALL)) ||
            icode.equals(Long.fromNumber(Constants.PUSHQ))) {
            return Long.fromNumber(-8, false);
        }
        if (icode.equals(Long.fromNumber(Constants.RET)) ||
            icode.equals(Long.fromNumber(Constants.POPQ))) {
            return Long.fromNumber(8, false);
        }
        else { return Long.ZERO; }
    }

    alu_B(ereg: E): Long {
        let icode = ereg.geticode().getOutput();
        if (icode.equals(Long.fromNumber(Constants.RMMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.MRMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.OPQ)) ||
            icode.equals(Long.fromNumber(Constants.CALL)) ||
            icode.equals(Long.fromNumber(Constants.PUSHQ)) ||
            icode.equals(Long.fromNumber(Constants.RET)) ||
            icode.equals(Long.fromNumber(Constants.POPQ))) {
            return ereg.getvalB().getOutput();
        }
        if (icode.equals(Long.fromNumber(Constants.RRMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.IRMOVQ))) {
            return Long.ZERO;
        }
        else { return Long.ZERO; }
    }

    alufun(ereg: E): Long {
        let icode = ereg.geticode().getOutput();
        if (icode == Long.fromNumber(Constants.OPQ)) {
            return ereg.getifun().getOutput();
        }
        return Long.fromNumber(Constants.ADD);
    }

    set_cc(ereg: E, wreg: W): boolean {
        let icode = ereg.geticode().getOutput(),
            M_stat = this.M_stat,
            w_stat = wreg.getstat().getOutput();

        return (icode.equals(Long.fromNumber(Constants.OPQ))
            && !(M_stat.equals(Long.fromNumber(Constants.SADR)) ||
                M_stat.equals(Long.fromNumber(Constants.SINS)) ||
                M_stat.equals(Long.fromNumber(Constants.SHLT)))
            && !(w_stat.equals(Long.fromNumber(Constants.SADR)) ||
                w_stat.equals(Long.fromNumber(Constants.SINS)) ||
                w_stat.equals(Long.fromNumber(Constants.SHLT))));
    }

    alu(ereg: E): Long {
        let A = this.alu_A(ereg),
            B = this.alu_B(ereg),
            valE = Long.ZERO;

        if (this.alufun(ereg).equals(Long.fromNumber(Constants.ADD))) {
            valE = A.add(B);
            this.cc(valE.isNegative(), valE.isZero(),
                this.utilsService.addOverflow(A, B))

            
            console.log("TEST")
            console.log("of: " + this.utilsService.addOverflow(Long.MAX_VALUE, Long.MIN_VALUE))
            console.log("END TEST")
        }
        if (this.alufun(ereg).equals(Long.fromNumber(Constants.SUB))) {
            valE = B.subtract(A);
            this.cc(valE.isNegative(), valE.isZero(),
                this.utilsService.subOverflow(A, B))
        }
        if (this.alufun(ereg).equals(Long.fromNumber(Constants.AND))) {
            valE = A.and(B);
            this.cc(valE.isNegative(), valE.isZero(), false);
        }
        if (this.alufun(ereg).equals(Long.fromNumber(Constants.XOR))) {
            valE = A.xor(B);
            this.cc(valE.isNegative(), valE.isZero(), false);
        }
        return valE;
    }

    cc(SF: boolean, ZF: boolean, OF: boolean): void {
        this.conditionCodesService.setOF(OF ? Long.ONE : Long.ZERO);
        this.conditionCodesService.setSF(SF ? Long.ONE : Long.ZERO);
        this.conditionCodesService.setZF(ZF ? Long.ONE : Long.ZERO);
    }

    get_E_Cnd(icode: Long, ifun: Long): Long {
        let OF = this.conditionCodesService.getOF(),
            SF = this.conditionCodesService.getSF(),
            ZF = this.conditionCodesService.getZF();

        let ret;

        if (icode.notEquals(Long.fromNumber(Constants.JXX)) && icode.notEquals(Long.fromNumber(Constants.CMOVXX))) { return Long.ZERO; }
        if (ifun.equals(Long.fromNumber(Constants.UNCOND))) { return Long.ONE; }
        if (ifun.equals(Long.fromNumber(Constants.LESSEQ))) { return ((SF.xor(OF)).or(ZF)); }
        if (ifun.equals(Long.fromNumber(Constants.LESS))) { return (SF.xor(OF)); }
        if (ifun.equals(Long.fromNumber(Constants.EQUAL))) { return ZF; }
        if (ifun.equals(Long.fromNumber(Constants.NOTEQUAL))) { return ZF.equals(Long.ZERO) ? Long.ONE : Long.ZERO; } // !ZF 
        if (ifun.equals(Long.fromNumber(Constants.GREATER))) {
            return (SF.xor(OF)).negate() && ZF.negate();
        }
        if (ifun.equals(Long.fromNumber(Constants.GREATEREQ))) { return (SF.xor(OF)).negate(); }
        else { return Long.NEG_ONE; }
    }

    set_E_dstE(ereg: E): Long {
        let icode = ereg.geticode().getOutput();

        if (icode.equals(Long.fromNumber(Constants.RRMOVQ)) && !this.E_Cnd) {
            return Long.fromNumber(Constants.RNONE);
        }
        return ereg.getdstE().getOutput();
    }

    /*
    * chooseValE
    * return the appropriate valE based on icode
    * calls alu() if the icode is an OPQ
    */
    chooseValE(ereg: E, wreg: W): Long {
        let icode = ereg.geticode().getOutput(),
            valA = ereg.getvalA().getOutput(),
            valB = ereg.getvalB().getOutput(),
            valC = ereg.getvalC().getOutput(),
            BYTE = 8;

        if (this.set_cc(ereg, wreg)) {
            return this.alu(ereg);
        }
        if (icode.equals(Long.fromNumber(Constants.CMOVXX))) {
            return valA;
        }
        if (icode.equals(Long.fromNumber(Constants.RMMOVQ)) ||
            icode.equals(Long.fromNumber(Constants.MRMOVQ))) {
            return valB.add(valC); //valB + valC
        }
        if (icode.equals(Long.fromNumber(Constants.CALL)) ||
            icode.equals(Long.fromNumber(Constants.PUSHQ))) {
            return valB.subtract(Long.fromNumber(BYTE)); //valB - BYTE
        }
        if (icode.equals(Long.fromNumber(Constants.RET)) ||
            icode.equals(Long.fromNumber(Constants.POPQ))) {
            return valB.add(Long.fromNumber(BYTE)); //valB + BYTE
        }
        if (icode.equals(Long.fromNumber(Constants.JXX)) ||
            icode.equals(Long.fromNumber(Constants.NOP)) ||
            icode.equals(Long.fromNumber(Constants.HALT))) {
            return Long.ZERO;
        }
        return valC;
    }

    /*
    * e_calculateControlSignals
    * check to see if the M register need to bubble or not
    */
    e_calculateControlSignals(wreg: W): void {
        let w_stat = wreg.getstat().getOutput();

        this.mbubble = ((this.M_stat.equals(Long.fromNumber(Constants.SADR)) ||
            this.M_stat.equals(Long.fromNumber(Constants.SINS)) ||
            this.M_stat.equals(Long.fromNumber(Constants.SHLT))) ||
            (w_stat.equals(Long.fromNumber(Constants.SADR)) ||
                w_stat.equals(Long.fromNumber(Constants.SINS)) ||
                w_stat.equals(Long.fromNumber(Constants.SHLT))));
    }

    /*
    * getEreg
    * @returns an Observable of type <E> for the ereg 
    * to pass to the E pipeline register
    */
    getEreg(): Observable<E> {
        return this.e_reg.asObservable();
    }

    /*
    * ==============================================================
    *                    M E M O R Y     S T A G E
    * ==============================================================
    */

    doMemoryStage(lineObject: Line, freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {
        this.freg = freg;
        this.dreg = dreg;
        this.ereg = ereg;
        this.mreg = mreg;
        this.wreg = wreg;

        this.doMemoryClockLow(lineObject, freg, dreg, ereg, mreg, wreg);
        this.doMemoryClockHigh(wreg);
    }

    doMemoryClockLow(lineObject: Line, freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {
        let icode = ereg.geticode().getOutput(),
            ifun = ereg.getifun().getOutput(),
            valE = Long.ZERO,
            dstE = Long.fromNumber(Constants.RNONE),
            dstM = ereg.getdstM().getOutput();

        this.M_stat = ereg.getstat().getOutput();
        this.M_valM = this.m_stat(mreg);

        let memory = MemoryFunc.getInstance(this.utilsService);

        let addr = this.mem_addr(mreg);
        if (this.mem_read(mreg)) {
            this.M_valM = memory.getLong(addr);
        }
        if (this.mem_write(mreg)) {
            memory.putLong(mreg.getvalA().getOutput(), addr);
        }

        this.setWInput(wreg, this.M_stat, icode, valE, this.M_valM, dstE, dstM);
    }

    doMemoryClockHigh(wreg: W): void {
        wreg.getstat().normal();
        wreg.geticode().normal();
        wreg.getvalE().normal();
        wreg.getvalM().normal();
        wreg.getdstE().normal();
        wreg.getdstM().normal();
    }

    setWInput(wreg: W, stat: Long, icode: Long, valE: Long,
        valM: Long, dstE: Long, dstM: Long) {
        wreg.getstat().setInput(stat);
        wreg.geticode().setInput(icode);
        wreg.getvalE().setInput(valE);
        wreg.getvalM().setInput(valM);
        wreg.getdstE().setInput(dstE);
        wreg.getdstM().setInput(dstM);
    }

    //TODO
    mem_read(mreg: M): boolean {
        return false;
    }

    //TODO
    mem_write(mreg: M): boolean {
        return false;
    }

    //TODO
    mem_addr(mreg: M): Long {
        return Long.ZERO;
    }

    //TODO
    m_stat(mreg): Long {
        return Long.ZERO;
    }

    /*
    * getMreg--
    * @returns an Observable of type <M> for the mreg 
    * to pass to the M pipeline register
    */
    getMreg(): Observable<M> {
        return this.m_reg.asObservable();
    }

    /*
    * ==============================================================
    *               W R I T E B A C K     S T A G E
    * ==============================================================
    */

    doWritebackStage(wreg: W): void {
        this.wreg = wreg;

        this.doWritebackClockLow(wreg);
        this.doWritebackClockHigh(wreg);
    }

    doWritebackClockLow(wreg: W): void {
    }

    doWritebackClockHigh(wreg: W): void {
    }

    /*
    * getWreg
    * @returns an Observable of type <W> for the wreg 
    * to pass to the W pipeline register
    */
    getWreg(): Observable<W> {
        return this.w_reg.asObservable();
    }
}
