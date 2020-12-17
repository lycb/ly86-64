import { Injectable } from "@angular/core";
import { InstructionService } from "../instruction/instruction.service";
import { ParserService } from "../parser/parser.service";
import { RegisterService } from "../register/register.service";
import { ConditionCodesService } from "../condition-codes/condition-codes.service";
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
  D_srcA: number;
  D_srcB: number;

  E_dstE: number;
  E_valE: number;
  E_Cnd: number;

  M_valM: number;
  M_stat: number;

  constructor(
    private instructionService: InstructionService,
    private parserService: ParserService,
    private registerService: RegisterService,
    private conditionCodesService: ConditionCodesService
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
      dreg.getstat().bubble(Constants.SAOK);
      dreg.geticode().bubble(Constants.NOP);
      dreg.getifun().bubble(0);
      dreg.getrA().bubble(Constants.RNONE);
      dreg.getrB().bubble(Constants.RNONE);
      dreg.getvalC().bubble(0);
      dreg.getvalP().bubble(0);
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
    this.f_pred.next("0");
    freg.getPredPC().setInput(0);
    freg.getPredPC().normal();
  }

  buildLong(arr: number[]): number {
    let ret = 0;
    for (let i = 6; i >= 0; i--) {
      ret = ret << 8;
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

    /*
    * F_stall
    * stalling logic for F register
    */
  f_stall(dreg: D, ereg: E, mreg: M): boolean {
    let e_icode = ereg.geticode().getOutput(),
      d_icode = dreg.geticode().getOutput(),
      m_icode = mreg.geticode().getOutput(),
      e_dstM = ereg.getdstM().getOutput();

    return (((e_icode == Constants.MRMOVQ || e_icode == Constants.POPQ) &&
      (e_dstM == this.D_srcA || e_dstM == this.D_srcB)) ||
      (e_icode == Constants.RET || d_icode == Constants.RET || m_icode == Constants.RET));
  }

    /*
    * D_stall
    * stalling logic for D register
    */
  d_stall(ereg: E): boolean {
    let e_icode = ereg.geticode().getOutput(),
      e_dstM = ereg.getdstM().getOutput();

    return (e_icode == Constants.MRMOVQ || e_icode == Constants.POPQ) &&
      (e_dstM == this.D_srcA || e_dstM == this.D_srcB);
  }

  d_bubble(dreg: D, ereg: E, mreg: M): boolean {
    let e_icode = ereg.geticode().getOutput(),
      d_icode = dreg.geticode().getOutput(),
      m_icode = mreg.geticode().getOutput(),
      e_dstM = ereg.getdstM().getOutput(),
      Cnd = this.E_Cnd;

    return (e_icode == Constants.JXX && !Cnd) ||
      (!((e_icode == Constants.MRMOVQ || e_icode == Constants.POPQ) &&
        (e_dstM == this.D_srcA || e_dstM == this.D_srcB)) &&
        (e_icode == Constants.RET || d_icode == Constants.RET ||
          m_icode == Constants.RET));
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
      ereg.getstat().bubble(Constants.SAOK);
      ereg.geticode().bubble(Constants.NOP);
      ereg.getifun().bubble(0);
      ereg.getvalC().bubble(0);
      ereg.getvalA().bubble(0);
      ereg.getvalB().bubble(0);
      ereg.getdstE().bubble(Constants.RNONE);
      ereg.getdstM().bubble(Constants.RNONE);
      ereg.getsrcA().bubble(Constants.RNONE);
      ereg.getsrcB().bubble(Constants.RNONE);
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

  set_D_srcA(dreg: D): number {
    let icode = dreg.geticode().getOutput(),
      rA = dreg.getrA().getOutput();

    if (icode == Constants.RRMOVQ || icode == Constants.RMMOVQ || icode == Constants.OPQ || icode == Constants.PUSHQ) {
      return rA;
    }
    if (icode == Constants.POPQ || icode == Constants.RET) {
      return Constants.RSP;
    }
    return Constants.RNONE;
  }

  set_D_srcB(dreg: D): number {
    let icode = dreg.geticode().getOutput(),
      rB = dreg.getrB().getOutput();

    if (icode == Constants.OPQ || icode == Constants.RMMOVQ || icode == Constants.MRMOVQ) {
      return rB;
    }
    if (icode == Constants.PUSHQ || icode == Constants.POPQ || icode == Constants.CALL || icode == Constants.RET) {
      return Constants.RSP;
    }
    return Constants.RNONE;
  }

  d_valA(dreg: D, mreg: M, wreg: W): number {
    let icode = dreg.geticode().getOutput();

    if (icode == Constants.CALL || icode == Constants.JXX) {
      return dreg.getvalP().getOutput();
    }
    if (this.D_srcA == Constants.RNONE) {
      return 0;
    }
    if (this.D_srcA == this.E_dstE) {
      return this.E_valE;
    }
    if (this.D_srcA == mreg.getdstM().getOutput()) {
      return this.M_valM;
    }
    if (this.D_srcA == mreg.getdstE().getOutput()) {
      return mreg.getvalE().getOutput();
    }
    if (this.D_srcA == wreg.getdstM().getOutput()) {
      return wreg.getvalE().getOutput();
    }
    if (this.D_srcA == wreg.getdstE().getOutput()) {
      return wreg.getvalE().getOutput();
    }

    let register = this.registerService.index2register(this.D_srcA)
    return this.registerService.getValueByRegister(register);
  }

  d_valB(mreg: M, wreg: W): number {
    if (this.D_srcB == Constants.RNONE) {
      return 0;
    }
    if (this.D_srcB == this.E_dstE) {
      return this.E_valE;
    }
    if (this.D_srcB == mreg.getdstM().getOutput()) {
      return this.M_valM;
    }
    if (this.D_srcB == mreg.getdstE().getOutput()) {
      return mreg.getvalE().getOutput();
    }
    if (this.D_srcB == wreg.getdstM().getOutput()) {
      return wreg.getvalM().getOutput();
    }
    if (this.D_srcB == wreg.getdstE().getOutput()) {
      return wreg.getvalE().getOutput();
    }

    let register = this.registerService.index2register(this.D_srcB)
    return this.registerService.getValueByRegister(register);
  }

  d_dstE(dreg: D): number {
    let icode = dreg.geticode().getOutput(),
      rB = dreg.getrB().getOutput();

    if (icode == Constants.OPQ || icode == Constants.RRMOVQ || icode == Constants.IRMOVQ) {
      return rB;
    }
    if (icode == Constants.PUSHQ || icode == Constants.POPQ || icode == Constants.CALL || icode == Constants.RET) {
      return Constants.RSP;
    }
    return Constants.RNONE;
  }

  d_dstM(dreg: D): number {
    let icode = dreg.geticode().getOutput(),
      rA = dreg.getrA().getOutput();

    if (icode == Constants.POPQ || icode == Constants.MRMOVQ) {
      return rA;
    }
    return Constants.RNONE;
  }

  d_calculateControlSignals(ereg: E): void {
    let e_dstM = ereg.getdstM().getOutput(),
      e_icode = ereg.geticode().getOutput();
    this.ebubble = ((e_icode == Constants.JXX && !this.E_Cnd) ||
      ((e_icode == Constants.MRMOVQ || e_icode == Constants.POPQ) &&
        (e_dstM == this.D_srcA || e_dstM == this.D_srcB)));
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

    this.E_Cnd = this.set_E_Cnd(icode, ifun);
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
      mreg.getstat().bubble(Constants.SAOK);
      mreg.geticode().bubble(Constants.NOP);
      mreg.getCnd().bubble(0);
      mreg.getvalE().bubble(0);
      mreg.getvalA().bubble(0);
      mreg.getdstE().bubble(Constants.RNONE);
      mreg.getdstM().bubble(Constants.RNONE);
    }
  }

  setMInput(mreg: M, icode: number, Cnd: number, stat: number, valE: number, valA: number,
    dstE: number, dstM: number) {
    mreg.getstat().setInput(stat);
    mreg.geticode().setInput(icode);
    mreg.getCnd().setInput(Cnd);
    mreg.getvalA().setInput(valA);
    mreg.getvalE().setInput(valE);
    mreg.getdstE().setInput(dstE);
    mreg.getdstM().setInput(dstM);
  }

  alu_A(ereg: E): number {
    let icode = ereg.geticode().getOutput();
    if (icode == Constants.RRMOVQ || icode == Constants.OPQ) {
      return ereg.getvalA().getOutput();
    }
    if (icode == Constants.IRMOVQ || icode == Constants.RMMOVQ || icode == Constants.MRMOVQ) {
      return ereg.getvalC().getOutput();
    }
    if (icode == Constants.CALL || icode == Constants.PUSHQ) { return -8; }
    if (icode == Constants.RET || icode == Constants.POPQ) { return 8; }
    else { return 0; }
  }

  alu_B(ereg: E): number {
    let icode = ereg.geticode().getOutput();
    if (icode == Constants.RMMOVQ || icode == Constants.MRMOVQ || icode == Constants.OPQ ||
      icode == Constants.CALL || icode == Constants.PUSHQ || icode == Constants.RET ||
      icode == Constants.POPQ) {
      return ereg.getvalB().getOutput();
    }
    if (icode == Constants.RRMOVQ || icode == Constants.IRMOVQ) { return 0; }
    else { return 0; }
  }

  alufun(ereg: E): number {
    let icode = ereg.geticode().getOutput();
    if (icode == Constants.OPQ) {
      return ereg.getifun().getOutput();
    }
    return Constants.ADD;
  }

  set_cc(ereg: E, wreg: W): boolean {
    let icode = ereg.geticode().getOutput(),
      M_stat = this.M_stat,
      w_stat = wreg.getstat().getOutput();

    return (icode == Constants.OPQ)
      && !(M_stat == Constants.SADR || M_stat == Constants.SINS || M_stat == Constants.SHLT)
      && !(w_stat == Constants.SADR || w_stat == Constants.SINS || w_stat == Constants.SHLT);
  }

  //TODO
  alu(ereg: E): number {
    let A = this.alu_A(ereg),
      B = this.alu_B(ereg),
      valE = 0;

    if (this.alufun(ereg) == Constants.ADD) {
      valE = A + B;
      //call cc()
    }
    if (this.alufun(ereg) == Constants.SUB) {
      valE = B - A;
      //call cc()
    }
    if (this.alufun(ereg) == Constants.AND) {
      valE = A & B;
      //call cc()
    }
    if (this.alufun(ereg) == Constants.XOR) {
      valE = A ^ B;
      //call cc()
    }
    return valE;
  }

  cc(SF: boolean, ZF: boolean, OF: boolean): void {
    this.conditionCodesService.setOF(OF);
    this.conditionCodesService.setSF(SF);
    this.conditionCodesService.setZF(ZF);
  }

  //TODO 
  set_E_Cnd(icode: number, ifun: number): number {
    let OF = this.conditionCodesService.getOF(),
    SF = this.conditionCodesService.getSF(),
    ZF = this.conditionCodesService.getZF();

    let ret;

    if (icode != Constants.JXX && icode != Constants.CMOVXX) { return 0; }
    if (ifun == Constants.UNCOND) { return 1; }
    if (ifun == Constants.LESSEQ) { return ((SF ^ OF) | ZF); }
    if (ifun == Constants.LESS) { return (SF ^ OF); }
    if (ifun == Constants.EQUAL) { return ZF; }
    if (ifun == Constants.NOTEQUAL) { return ZF == 0 ? 1 : 0; } // !ZF 
    if (ifun == Constants.GREATER) { 
      ZF = (ZF == 0 ? 1 : 0);
      let temp = SF ^ OF;
      temp = (temp == 0 ? 1 : 0);
      return (temp & ZF); // !(SF ^ OF) && !ZF;
    }
    if (ifun == Constants.GREATEREQ) { 
      let temp = SF ^ OF;
      temp = (temp == 0 ? 1 : 0);
      return temp // !(SF ^ OF); 
    }
    else { return -1; }
  }

  set_E_dstE(ereg: E): number {
    let icode = ereg.geticode().getOutput();

    if (icode == Constants.RRMOVQ && !this.E_Cnd) {
      return Constants.RNONE;
    }
    return ereg.getdstE().getOutput();
  }

    /*
    * chooseValE
    * return the appropriate valE based on icode
    * calls alu() if the icode is an OPQ
    */
  chooseValE(ereg: E, wreg: W): number {
    let icode = ereg.geticode().getOutput(),
      valA = ereg.getvalA().getOutput(),
      valB = ereg.getvalB().getOutput(),
      valC = ereg.getvalC().getOutput(),
      BYTE = 8;

    if (this.set_cc(ereg, wreg)) {
      return this.alu(ereg);
    }
    if (icode == Constants.CMOVXX) {
      return valA;
    }
    if (icode == Constants.RMMOVQ || icode == Constants.MRMOVQ) {
      return valB + valC;
    }
    if (icode == Constants.CALL || icode == Constants.PUSHQ) {
      return valB - BYTE;
    }
    if (icode == Constants.RET || icode == Constants.POPQ) {
      return valB + BYTE
    }
    if (icode == Constants.JXX || icode == Constants.NOP || icode == Constants.HALT) {
      return 0;
    }
    return valC;
  }

    /*
    * e_calculateControlSignals
    * check to see if the M register need to bubble or not
    */
  e_calculateControlSignals(wreg: W): void {
    let w_stat = wreg.getstat().getOutput();

    this.mbubble = ((this.M_stat == Constants.SADR || this.M_stat == Constants.SINS || this.M_stat == Constants.SHLT) ||
      (w_stat == Constants.SADR || w_stat == Constants.SINS || w_stat == Constants.SHLT));
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
      stat = ereg.getstat().getOutput(),
      valE = 0,
      valM = 0,
      dstE = Constants.RNONE,
      dstM = ereg.getdstM().getOutput();

    this.setWInput(wreg, stat, icode, valE, valM, dstE, dstM);
  }

  doMemoryClockHigh(wreg: W): void {
    wreg.getstat().normal();
    wreg.geticode().normal();
    wreg.getvalE().normal();
    wreg.getvalM().normal();
    wreg.getdstE().normal();
    wreg.getdstM().normal();
  }

  setWInput(wreg: W, stat: number, icode: number, valE: number,
    valM: number, dstE: number, dstM: number) {
    wreg.getstat().setInput(stat);
    wreg.geticode().setInput(icode);
    wreg.getvalE().setInput(valE);
    wreg.getvalM().setInput(valM);
    wreg.getdstE().setInput(dstE);
    wreg.getdstM().setInput(dstM);
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
