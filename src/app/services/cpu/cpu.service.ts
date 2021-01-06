import { Injectable } from "@angular/core";
import { InstructionService } from "../instruction/instruction.service";
import { ParserService } from "../parser/parser.service";
import { RegisterService } from "../register/register.service";
import { ConditionCodesService } from "../condition-codes/condition-codes.service";
import { UtilsService } from "../utils/utils.service";
import { Line } from "../../models/Line";
import { MemoryService } from "../memory/memory.service";
import { F, D, E, M, W } from "../../models/PipeReg";
import * as Constants from "../../constants";
import Long from 'long';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: "root",
})
export class CpuService {
  error: boolean;

  // Observables for passing values to the pipeline register component
  f_pred = new Subject<any>();
  d_reg = new Subject<D>();
  e_reg = new Subject<E>();
  m_reg = new Subject<M>();
  w_reg = new Subject<W>();

  // Observables for passing values to the control logic component
  logic = new Subject<string[]>();

  logic_string = ["", "", "", ""];
  f_logic_string = "";
  d_logic_string = "";
  e_logic_string = "";
  m_logic_string = "";

  // Observables for passing values to the condition flags component
  condition_flag = new Subject<number[]>();

  cc_list = [0, 0, 0];

  // Stalling, bubbling logic variables
  fstall: boolean;

  dstall: boolean;
  dbubble: boolean;

  ebubble: boolean;

  mbubble: boolean;

  // Global variables for passing in between stages
  d_srcA: Long;
  d_srcB: Long;

  e_dstE: Long;
  e_valE: Long;
  e_Cnd: Long;

  m_valM: Long;
  m_stat: Long;

  constructor(
    private instructionService: InstructionService,
    private parserService: ParserService,
    private registerService: RegisterService,
    private conditionCodesService: ConditionCodesService,
    private utilsService: UtilsService,
    private memoryService: MemoryService
  ) {
    this.error = false;
  }

  /*
  * doSimulation
  * performs simulation for the pipeline
  */
  doSimulation(lineObject: Line, freg: F, dreg: D, ereg: E, mreg: M, wreg: W): boolean {
    this.logic_string = ["", "", ""];

    let stop = this.doWritebackClockLow(wreg);
    this.doMemoryClockLow(lineObject, freg, dreg, ereg, mreg, wreg);
    this.doExecuteClockLow(lineObject, freg, dreg, ereg, mreg, wreg);
    this.doDecodeClockLow(lineObject, freg, dreg, ereg, mreg, wreg);
    this.doFetchClockLow(lineObject, freg, dreg, ereg, mreg, wreg);

    if (this.fstall) {
      this.logic_string[0] = this.f_logic_string;
    }
    if (this.dstall || this.dbubble) {
      this.logic_string[1] = this.d_logic_string;
    }
    if (this.ebubble) {
      this.logic_string[2] = this.e_logic_string;
    }
    if (this.mbubble) {
      this.logic_string[3] = this.m_logic_string;
    }

    this.doWritebackClockHigh(wreg);
    this.doMemoryClockHigh(wreg);
    this.doExecuteClockHigh(mreg);
    this.doDecodeClockHigh(ereg);
    this.doFetchClockHigh(freg, dreg);
    this.logic.next(this.logic_string);

    return stop;
  }

  resetValues(freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {
    this.f_pred.next("0");
    freg.getPredPC().setInput(Long.ZERO);
    freg.getPredPC().normal();
  }

  holdHighlight(dreg: D): boolean {
    return this.fstall || dreg.geticode().getOutput().equals(Long.ZERO)
  }

  /*
  * ==============================================================
  *                    F E T C H     S T A G E
  * ==============================================================
  */

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
    this.f_pred.next(freg.getPredPC().getOutput().toString(16));
    this.d_reg.next(dreg);
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
    let arr = new Array<Long>(8);
    if (this.needValC(icode)) {
      if (!this.needRegister(icode)) {
        let index = 0;
        for (let i = f_pc.toNumber() + 1; index < 8; i++) {
          arr[index] = this.memoryService.getByte(i);
          index++;
        }
        return this.utilsService.buildLong(arr);
      } else {
        let index = 0;
        for (let i = f_pc.toNumber() + 2; index < 8; i++) {
          arr[index] = this.memoryService.getByte(i);
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
    const m_Cnd = mreg.getCnd().getOutput() == Long.ONE ? true : false;

    if (m_icode.equals(Long.fromNumber(Constants.JXX)) && !m_Cnd) {
      return mreg.getvalA().getOutput();
    } else if (w_icode.equals(Long.fromNumber(Constants.RET))) {
      return wreg.getvalM().getOutput();
    } else {
      return freg.getPredPC().getOutput();
    }
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
      (e_dstM.equals(this.d_srcA) || e_dstM.equals(this.d_srcB))) ||
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
      (e_dstM.equals(this.d_srcA) || e_dstM.equals(this.d_srcB));
  }

  d_bubble(dreg: D, ereg: E, mreg: M): boolean {
    this.d_logic_string = "";

    let e_icode = ereg.geticode().getOutput(),
      d_icode = dreg.geticode().getOutput(),
      m_icode = mreg.geticode().getOutput(),
      e_dstM = ereg.getdstM().getOutput(),
      Cnd = this.e_Cnd == Long.ONE ? true: false;

    return (e_icode.equals(Long.fromNumber(Constants.JXX)) && !Cnd) ||
      (!((e_icode.equals(Long.fromNumber(Constants.MRMOVQ)) || e_icode.equals(Long.fromNumber(Constants.POPQ))) &&
        (e_dstM.equals(this.d_srcA) || e_dstM.equals(this.d_srcB))) &&
        (e_icode.equals(Long.fromNumber(Constants.RET)) || d_icode.equals(Long.fromNumber(Constants.RET)) ||
          m_icode.equals(Long.fromNumber(Constants.RET))));
  }

  f_calculateControlSignals(dreg: D, ereg: E, mreg: M): void {
    this.fstall = this.f_stall(dreg, ereg, mreg);
    this.dstall = this.d_stall(ereg);
    this.dbubble = this.d_bubble(dreg, ereg, mreg);

    if (this.fstall) {
      this.f_logic_string = "F (stalled): " + this.formFStallLogicString(dreg, ereg, mreg);
    }
    if (this.dbubble) {
      this.d_logic_string = "D (bubbled): " + this.formDBubbleLogicString(dreg, ereg, mreg);
    }
    else if (this.dstall) {
      this.d_logic_string = "D (stalled): " + this.formDStallLogicString(ereg);
    }

  }


  /*
  * ==============================================================
  *                    D E C O D E     S T A G E
  * ==============================================================
  */


  doDecodeClockLow(lineObject: Line, freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {
    let line = lineObject.parsedLine.instruction;

    this.d_srcA = this.set_d_srcA(dreg);
    this.d_srcB = this.set_d_srcB(dreg);

    let icode = dreg.geticode().getOutput(),
      ifun = dreg.getifun().getOutput(),
      stat = dreg.getstat().getOutput(),
      valA = this.d_valA(dreg, mreg, wreg),
      valB = this.d_valB(mreg, wreg),
      valC = dreg.getvalC().getOutput(),
      dstE = this.d_dstE(dreg),
      dstM = this.d_dstM(dreg);

    this.d_calculateControlSignals(ereg);

    this.setEInput(ereg, stat, icode, ifun, valC, valA, valB, dstE, dstM, this.d_srcA, this.d_srcB);
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
    this.e_reg.next(ereg);
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

  set_d_srcA(dreg: D): Long {
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

  set_d_srcB(dreg: D): Long {
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
    if (this.d_srcA.equals(Long.fromNumber(Constants.RNONE))) {
      return Long.ZERO;
    }
    if (this.d_srcA.equals(this.e_dstE)) {
      return this.e_valE;
    }
    if (this.d_srcA.equals(mreg.getdstM().getOutput())) {
      return this.m_valM;
    }
    if (this.d_srcA.equals(mreg.getdstE().getOutput())) {
      return mreg.getvalE().getOutput();
    }
    if (this.d_srcA.equals(wreg.getdstM().getOutput())) {
      return wreg.getvalE().getOutput();
    }
    if (this.d_srcA.equals(wreg.getdstE().getOutput())) {
      return wreg.getvalE().getOutput();
    }

    let register = this.registerService.index2register(this.d_srcA.toNumber())
    return this.registerService.getValueByRegister(register);
  }

  d_valB(mreg: M, wreg: W): Long {
    if (this.d_srcB.equals(Long.fromNumber(Constants.RNONE))) {
      return Long.ZERO;
    }
    if (this.d_srcB.equals(this.e_dstE)) {
      return this.e_valE;
    }
    if (this.d_srcB.equals(mreg.getdstM().getOutput())) {
      return this.m_valM;
    }
    if (this.d_srcB.equals(mreg.getdstE().getOutput())) {
      return mreg.getvalE().getOutput();
    }
    if (this.d_srcB.equals(wreg.getdstM().getOutput())) {
      return wreg.getvalM().getOutput();
    }
    if (this.d_srcB.equals(wreg.getdstE().getOutput())) {
      return wreg.getvalE().getOutput();
    }

    let register = this.registerService.index2register(this.d_srcB.toNumber());
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

    let Cnd = this.e_Cnd == Long.ONE ? true : false;

    this.ebubble = ((e_icode.equals(Long.fromNumber(Constants.JXX)) && !Cnd) ||
      ((e_icode.equals(Long.fromNumber(Constants.MRMOVQ)) || e_icode.equals(Long.fromNumber(Constants.POPQ))) &&
        (e_dstM.equals(this.d_srcA) || e_dstM.equals(this.d_srcB))));

    if (this.ebubble) {
      this.e_logic_string = "E (bubbled): " + this.formEBubbleLogicString(ereg);
    }
  }

  /*
  * ==============================================================
  *                    E X E C U T E     S T A G E
  * ==============================================================
  */

  doExecuteClockLow(lineObject: Line, freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {
    let line = lineObject.parsedLine.instruction;

    let icode = ereg.geticode().getOutput(),
      ifun = ereg.getifun().getOutput(),
      stat = ereg.getstat().getOutput(),
      valA = ereg.getvalA().getOutput(),
      dstM = ereg.getdstM().getOutput();


    this.e_Cnd = this.get_e_Cnd(icode, ifun);
    this.e_dstE = this.set_e_dstE(ereg);
    this.e_valE = this.chooseValE(ereg, wreg);

    this.e_calculateControlSignals(wreg);

    this.setMInput(mreg, icode, this.e_Cnd, stat, this.e_valE, valA, this.e_dstE, dstM);
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
    this.m_reg.next(mreg);
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
    if (icode.equals(Long.fromNumber(Constants.OPQ))) {
      return ereg.getifun().getOutput();
    }
    return Long.fromNumber(Constants.ADD);
  }

  set_cc(ereg: E, wreg: W): boolean {
    let icode = ereg.geticode().getOutput(),
      m_stat = this.m_stat,
      w_stat = wreg.getstat().getOutput();

    return (icode.equals(Long.fromNumber(Constants.OPQ))
      && !(m_stat.equals(Long.fromNumber(Constants.SADR)) ||
        m_stat.equals(Long.fromNumber(Constants.SINS)) ||
        m_stat.equals(Long.fromNumber(Constants.SHLT)))
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

    this.cc_list[0] = this.conditionCodesService.getOF().toNumber();
    this.cc_list[1] = this.conditionCodesService.getSF().toNumber();
    this.cc_list[2] = this.conditionCodesService.getZF().toNumber();

    this.condition_flag.next(this.cc_list)
  }

  get_e_Cnd(icode: Long, ifun: Long): Long {
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
      let condition = SF.xor(OF);
      return (condition.equals(Long.ZERO) ? Long.ONE : Long.ZERO) && (ZF.equals(Long.ZERO) ? Long.ONE : Long.ZERO);
    }
    if (ifun.equals(Long.fromNumber(Constants.GREATEREQ))) {
      let condition =  SF.xor(OF);
      return (condition.equals(Long.ZERO)) ? Long.ONE : Long.ZERO;
    }
    alert("error with e_Cnd")
    return Long.NEG_ONE; 
  }

  set_e_dstE(ereg: E): Long {
    let icode = ereg.geticode().getOutput();
    
    if (icode.equals(Long.fromNumber(Constants.RRMOVQ)) && 
      (this.e_Cnd.equals(Long.ZERO) ? true : false)) {
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

    this.mbubble = ((this.m_stat.equals(Long.fromNumber(Constants.SADR)) ||
      this.m_stat.equals(Long.fromNumber(Constants.SINS)) ||
      this.m_stat.equals(Long.fromNumber(Constants.SHLT))) ||
      (w_stat.equals(Long.fromNumber(Constants.SADR)) ||
        w_stat.equals(Long.fromNumber(Constants.SINS)) ||
        w_stat.equals(Long.fromNumber(Constants.SHLT))));

    if (this.mbubble) {
      this.m_logic_string = "M (bubbled): " + this.formMBubbleLogicString(wreg);
    }
  }

  /*
  * ==============================================================
  *                    M E M O R Y     S T A G E
  * ==============================================================
  */

  doMemoryClockLow(lineObject: Line, freg: F, dreg: D, ereg: E, mreg: M, wreg: W): void {
    let icode = mreg.geticode().getOutput(),
      valE = mreg.getvalE().getOutput(),
      dstE = mreg.getdstE().getOutput(),
      dstM = mreg.getdstM().getOutput();

    this.m_valM = Long.ZERO;

    let addr = this.mem_addr(mreg);
    if (this.mem_read(icode)) {
      this.m_valM = this.memoryService.getLong(addr.toNumber());
    }
    if (this.mem_write(icode)) {
      this.memoryService.putLong(mreg.getvalA().getOutput(), addr.toNumber());
    }

    this.error = this.memoryService.getError();
    this.m_stat = this.mstat(mreg);

    this.setWInput(wreg, this.m_stat, icode, valE, this.m_valM, dstE, dstM);
  }

  doMemoryClockHigh(wreg: W): void {
    wreg.getstat().normal();
    wreg.geticode().normal();
    wreg.getvalE().normal();
    wreg.getvalM().normal();
    wreg.getdstE().normal();
    wreg.getdstM().normal();
    this.w_reg.next(wreg);
  }

  setWInput(wreg: W, stat: Long, icode: Long, valE: Long,
    valM: Long, dstE: Long, dstM: Long): void {
    wreg.getstat().setInput(stat);
    wreg.geticode().setInput(icode);
    wreg.getvalE().setInput(valE);
    wreg.getvalM().setInput(valM);
    wreg.getdstE().setInput(dstE);
    wreg.getdstM().setInput(dstM);

  }

  /*
  * mem_read
  * if the instruction requires memory access,
  * this methods returns true
  */
  mem_read(icode: Long): boolean {
    return icode.equals(Long.fromNumber(Constants.MRMOVQ)) ||
      icode.equals(Long.fromNumber(Constants.POPQ)) ||
      icode.equals(Long.fromNumber(Constants.RET));
  }

  /*
  * mem_write
  * if the instruction requires writing to memory,
  * this methods returns true
  */
  mem_write(icode: Long): boolean {
    return icode.equals(Long.fromNumber(Constants.RMMOVQ)) ||
      icode.equals(Long.fromNumber(Constants.PUSHQ)) ||
      icode.equals(Long.fromNumber(Constants.CALL));
  }

  /*
  * mem_addr
  * returns the address that is used to access memory using icode.
  */
  mem_addr(mreg: M): Long {
    let icode = mreg.geticode().getOutput();
    if (icode.equals(Long.fromNumber(Constants.RMMOVQ)) ||
      icode.equals(Long.fromNumber(Constants.PUSHQ)) ||
      icode.equals(Long.fromNumber(Constants.CALL)) ||
      icode.equals(Long.fromNumber(Constants.MRMOVQ))) {
      return mreg.getvalE().getOutput();
    } else if (icode.equals(Long.fromNumber(Constants.POPQ)) ||
      icode.equals(Long.fromNumber(Constants.RET))) {
      return mreg.getvalA().getOutput();
    } else {
      return Long.ZERO;
    }
  }

  /*
  * m_stat
  * sets the m_stat variable based on error from accessing memory
  */
  mstat(mreg: M): Long {
    if (this.error) return Long.fromNumber(Constants.SADR);
    else return mreg.getstat().getOutput();
  }

  /*
  * ==============================================================
  *               W R I T E B A C K     S T A G E
  * ==============================================================
  */

  doWritebackClockLow(wreg: W): boolean {
    let stat = wreg.getstat().getOutput();

    return stat.notEquals(Long.fromNumber(Constants.SAOK));
  }

  doWritebackClockHigh(wreg: W): void {
    let valE = wreg.getvalE().getOutput(),
      dstE = wreg.getdstE().getOutput(),
      valM = wreg.getvalM().getOutput(),
      dstM = wreg.getdstM().getOutput(),
      r_dstE = this.registerService.index2register(dstE.toNumber()),
      r_dstM = this.registerService.index2register(dstM.toNumber());
   
    this.registerService.setValueByRegister(r_dstE, valE);
    this.registerService.setValueByRegister(r_dstM, valM);
  }



  /*
  * ==============================================================
  *                        C O L O R I N G
  * ==============================================================
  */
  getFColor(): string {
    return this.fstall ? "STALL" : "NORMAL";
  }

  getDColor(): string {
    if (this.dbubble) {
      return "BUBBLE";
    } else if (this.dstall) {
      return "STALL";
    } else {
      return "NORMAL";
    }
  }

  getEColor(): string {
    return this.ebubble ? "BUBBLE" : "NORMAL";
  }

  getMColor(): string {
    return this.mbubble ? "BUBBLE" : "NORMAL";
  }

  getWColor(): string {
    return "NORMAL";
  }

  /*
  * ==============================================================
  *                        O B S E R V A B L E S 
  * ==============================================================
  */
  getCC(): Observable<number[]> {
    return this.condition_flag.asObservable();
  }

  getLogic(): Observable<string[]> {
    return this.logic.asObservable();
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
  * getMreg--
  * @returns an Observable of type <M> for the mreg 
  * to pass to the M pipeline register
  */
  getMreg(): Observable<M> {
    return this.m_reg.asObservable();
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
  * getEreg
  * @returns an Observable of type <E> for the ereg 
  * to pass to the E pipeline register
  */
  getEreg(): Observable<E> {
    return this.e_reg.asObservable();
  }

  /*
  * getWreg
  * @returns an Observable of type <W> for the wreg 
  * to pass to the W pipeline register
  */
  getWreg(): Observable<W> {
    return this.w_reg.asObservable();
  }

  /*
  * ==============================================================
  *                S T R I N G     F O R M A T S 
  * ==============================================================
  */

  /*
  * formFStallLogicString
  * forms the string for F stalling
  * 
  * HCL:
  *  bool F_stall = E_icode in { IMRMOVQ, IPOPQ } &&  E_dstM in { d_srcA, d_srcB } || 
  *            IRET in { D_icode, E_icode, M_icode }; 
  */
  formFStallLogicString(dreg: D, ereg: E, mreg: M): string {
    let e_icode = ereg.geticode().getOutput(),
      d_icode = dreg.geticode().getOutput(),
      m_icode = mreg.geticode().getOutput(),
      e_dstM = ereg.getdstM().getOutput();

    let icodes_list = [];
    let dstm_list = [];
    let ret_list = [];
    let str = "";

    if (e_icode.equals(Long.fromNumber(Constants.MRMOVQ))) {
      icodes_list.push("MRMOVQ");
    }
    if (e_icode.equals(Long.fromNumber(Constants.POPQ))) {
      icodes_list.push("POPQ");
    }
    if (e_dstM.equals(this.d_srcA)) {
      dstm_list.push("d_srcA")
    }
    if (e_dstM.equals(this.d_srcB)) {
      dstm_list.push("d_srcB")
    }
    if (e_icode.equals(Long.fromNumber(Constants.RET))) {
      ret_list.push("E_icode")
    }
    if (d_icode.equals(Long.fromNumber(Constants.RET))) {
      ret_list.push("D_icode")
    }
    if (m_icode.equals(Long.fromNumber(Constants.RET))) {
      ret_list.push("M_icode")
    }

    if (icodes_list.length > 0) {
      str += "E_icode in {" + icodes_list + "}";
      if (dstm_list.length > 0) {
        str += " && E_dstM in {" + dstm_list + "}";
      }
    }

    if (ret_list.length > 0) {
      str += " || IRET in {" + ret_list + "}";
    }
    return str;
  }

  /*
  * formDStallLogicString
  * forms the string for D stalling
  * 
  * HCL:
  *  bool D_stall = E_icode in { IMRMOVQ, IPOPQ } &&  E_dstM in { d_srcA, d_srcB } 
  */
  formDStallLogicString(ereg: E): string {
    let icodes_list = [];
    let dstm_list = [];
    let ret_list = [];

    let str = "";

    let e_icode = ereg.geticode().getOutput(),
      e_dstM = ereg.getdstM().getOutput();

    if (e_icode.equals(Long.fromNumber(Constants.MRMOVQ))) {
      icodes_list.push("MRMOVQ");
    }
    if (e_icode.equals(Long.fromNumber(Constants.POPQ))) {
      icodes_list.push("POPQ");
    }
    if (e_dstM.equals(this.d_srcA)) {
      dstm_list.push("d_srcA")
    }
    if (e_dstM.equals(this.d_srcB)) {
      dstm_list.push("d_srcB")
    }

    if (icodes_list.length > 0) {
      str += "E_icode in {" + icodes_list + "}";
      if (dstm_list.length > 0) {
        str += " && E_dstM in {" + dstm_list + "}";
      }
    }
    return str;
  }

  
  /*
  * formDBubbleLogicString
  * forms the string for D bubbling
  * 
  * HCL:
  *  bool D_bubble = ( E_icode == IJXX && !e_Cnd ) ||
  *   !( E_icode in { IMRMOVQ, IPOPQ } && E_dstM in { d_srcA, d_srcB }) && 
  *   IRET in { D_icode, E_icode, M_icode };
  */
  formDBubbleLogicString(dreg: D, ereg: E, mreg: M): string {
    let e_icode = ereg.geticode().getOutput(),
      d_icode = dreg.geticode().getOutput(),
      m_icode = mreg.geticode().getOutput(),
      e_dstM = ereg.getdstM().getOutput(),
      Cnd = this.e_Cnd ? true : false;

    let icodes_list = [];
    let dstm_list = [];
    let ret_list = [];

    let str = "";


    if (e_icode.equals(Long.fromNumber(Constants.JXX)) && !Cnd) {
      str = "(E_icode in JXX && !e_Cnd)";
    }
    if (e_icode.equals(Long.fromNumber(Constants.MRMOVQ))) {
      icodes_list.push("MRMOVQ");
    }
    if (e_icode.equals(Long.fromNumber(Constants.POPQ))) {
      icodes_list.push("POPQ");
    }
    if (e_dstM.equals(this.d_srcA)) {
      dstm_list.push("d_srcA")
    }
    if (e_dstM.equals(this.d_srcB)) {
      dstm_list.push("d_srcB")
    }
    if (e_icode.equals(Long.fromNumber(Constants.RET))) {
      ret_list.push("E_icode")
    }
    if (d_icode.equals(Long.fromNumber(Constants.RET))) {
      ret_list.push("D_icode")
    }
    if (m_icode.equals(Long.fromNumber(Constants.RET))) {
      ret_list.push("M_icode")
    }

    if (icodes_list.length > 0) {
      str += "|| !(E_icode in {" + icodes_list + "}";
      if (dstm_list.length > 0) {
        str += " && E_dstM in {" + dstm_list + "})";
      }
    }

    if (ret_list.length > 0) {
      str += " && IRET in {" + ret_list + "}";
    }

    return str;
  }

  /*
  * formEBubbleLogicString
  * forms the string for E bubbling
  * 
  * HCL:
  *  bool E_bubble = ( E_icode == IJXX && !e_Cnd ) ||  
  *             ( E_icode in { IMRMOVQ, IPOPQ } &&  E_dstM in { d_srcA, d_srcB } );
  */
  formEBubbleLogicString(ereg: E): string {
    let icodes_list = [];
    let dstm_list = [];
    let ret_list = [];

    let str = "";

    let Cnd = this.e_Cnd == Long.ONE ? true : false;

    let e_dstM = ereg.getdstM().getOutput(),
      e_icode = ereg.geticode().getOutput();

    if (e_icode.equals(Long.fromNumber(Constants.JXX)) && !Cnd) {
      str = "(E_icode in JXX && !e_Cnd)";
    }
    if (e_icode.equals(Long.fromNumber(Constants.MRMOVQ))) {
      icodes_list.push("MRMOVQ");
    }
    if (e_icode.equals(Long.fromNumber(Constants.POPQ))) {
      icodes_list.push("POPQ");
    }
    if (e_dstM.equals(this.d_srcA)) {
      dstm_list.push("d_srcA")
    }
    if (e_dstM.equals(this.d_srcB)) {
      dstm_list.push("d_srcB")


      if (icodes_list.length > 0) {
        str += "E_icode in {" + icodes_list + "}";
        if (dstm_list.length > 0) {
          str += " && E_dstM in {" + dstm_list + "}";
        }
      }

      if (ret_list.length > 0) {
        str += " && IRET in {" + ret_list + "}";
      }

      return str;
    }
  }

  /*
  * formMBubbleLogicString
  * forms the string for M bubbling
  * 
  * HCL:
  *  bool M_bubble = m_stat in { SADR, SINS, SHLT } || W_stat in { SADR, SINS, SHLT };
  */
  formMBubbleLogicString(wreg: W): string {
    let str = "";
    let w_stat = wreg.getstat().getOutput();

    let m_stat_list = [];
    let w_stat_list = [];

    if (this.m_stat.equals(Long.fromNumber(Constants.SADR))) {
      m_stat_list.push("SADR");
    }
    if (this.m_stat.equals(Long.fromNumber(Constants.SINS))) {
      m_stat_list.push("SINS");
    }
    if (this.m_stat.equals(Long.fromNumber(Constants.SHLT))) {
      m_stat_list.push("SHLT");
    }
    if (w_stat.equals(Long.fromNumber(Constants.SADR))) {
      w_stat_list.push("SADR");
    }
    if (w_stat.equals(Long.fromNumber(Constants.SINS))) {
      w_stat_list.push("SINS");
    }
    if (w_stat.equals(Long.fromNumber(Constants.SHLT))) {
      w_stat_list.push("SHLT");
    }

    if (m_stat_list.length > 0) {
      str += "m_stat in {" + m_stat_list + "}";
    }

    if (w_stat_list.length > 0) {
      str += "W_stat in {" + w_stat_list + "}";
    }

    return str;
  }
}
