import { Component, OnInit } from '@angular/core';
import { F, D, E, M, W } from "../../models/PipeReg";
import { CpuService } from '../../services/cpu/cpu.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pipeline-reg',
  templateUrl: './pipeline-reg.component.html',
  styleUrls: ['./pipeline-reg.component.css']
})
export class PipelineRegComponent implements OnInit {
  f_state: string;
  d_state: string;
  e_state: string;
  m_state: string;
  w_state: string;

  fpredPCsubsription: Subscription;
  dregSubscription: Subscription;
  eregSubscription: Subscription;
  mregSubscription: Subscription;
  wregSubscription: Subscription;

  freg: F;
  dreg: D;
  ereg: E;
  mreg: M;
  wreg: W;

  f_predPC: string;

  d_stat: string;
  d_icode: string;
  d_ifun: string;
  d_rA: string;
  d_rB: string;
  d_valC: string;
  d_valP: string;

  e_stat: string;
  e_icode: string;
  e_ifun: string;
  e_valC: string;
  e_valA: string;
  e_valB: string;
  e_dstE: string;
  e_dstM: string;
  e_srcA: string;
  e_srcB: string;

  m_stat: string;
  m_icode: string;
  m_cnd: string;
  m_valE: string;
  m_valA: string;
  m_dstE: string;
  m_dstM: string;

  w_stat: string;
  w_icode: string;
  w_ifun: string;
  w_valE: string;
  w_valM: string;
  w_dstE: string;
  w_dstM: string;

  constructor(private cpuService: CpuService) {
    this.d_stat = "1";
    this.d_icode = "1";
    this.d_ifun = "0";
    this.d_rA = "f";
    this.d_rB = "f";
    this.d_valC = "0";
    this.d_valP = "0";

    this.e_stat = "1";
    this.e_icode = "1";
    this.e_ifun = "0";
    this.e_valC = "0";
    this.e_valA = "0";
    this.e_valB = "0";
    this.e_dstE = "f";
    this.e_dstM = "f";
    this.e_srcA = "f";
    this.e_srcB = "f";

    this.m_stat = "1";
    this.m_icode = "1";
    this.m_cnd = "0";
    this.m_valE = "0";
    this.m_valA = "0";
    this.m_dstE = "f";
    this.m_dstM = "f";

    this.w_stat = "1";
    this.w_icode = "1";
    this.w_valE = "0";
    this.w_valM = "0";
    this.w_dstE = "f";
    this.w_dstM = "f";

    this.f_state = "NA";
    this.d_state = "NA";
    this.e_state = "NA";
    this.m_state = "NA";
    this.w_state = "NA";

    this.f_predPC = "0";

    this.getWreg();
    this.getMreg();
    this.getEreg();
    this.getDreg();
    this.getFpredPC();
  }

  ngOnInit() {
  }

  getFpredPC() {
    this.fpredPCsubsription = this.cpuService.getPredPC().subscribe(pc => {
      if (pc) {
        this.f_predPC = pc;
        this.setColor();
      } else {
        this.f_predPC = "error";
      }
    });
  }

  getDreg() {
    this.dregSubscription = this.cpuService.getDreg().subscribe(dreg => {
      if (dreg) {
        this.dreg = dreg;
        this.d_stat = dreg.stat.state.toString(16);
        this.d_icode = dreg.icode.state.toString(16);
        this.d_ifun = dreg.ifun.state.toString(16);
        this.d_rA = dreg.rA.state.toString(16);
        this.d_rB = dreg.rB.state.toString(16);
        this.d_valC = dreg.valC.state.toUnsigned().toString(16);
        this.d_valP = dreg.valP.state.toUnsigned().toString(16);
        // this.setColor();
      } else {
        this.d_stat = "1";
        this.d_icode = "1";
        this.d_ifun = "0";
        this.d_rA = "f";
        this.d_rB = "f";
        this.d_valC = "0";
        this.d_valP = "0";
      }
    });
  }

  getEreg() {
    this.eregSubscription = this.cpuService.getEreg().subscribe(ereg => {
      if (ereg) {
        this.ereg = ereg;
        this.e_stat = ereg.stat.state.toString(16);
        this.e_icode = ereg.icode.state.toString(16);
        this.e_ifun = ereg.ifun.state.toString(16);
        this.e_valC = ereg.valC.state.toUnsigned().toString(16);
        this.e_valA = ereg.valA.state.toUnsigned().toString(16);
        this.e_valB = ereg.valB.state.toUnsigned().toString(16);
        this.e_dstE = ereg.dstE.state.toString(16);
        this.e_dstM = ereg.dstM.state.toString(16);
        this.e_srcA = ereg.srcA.state.toString(16);
        this.e_srcB = ereg.srcB.state.toString(16);
        this.setColor();
      } else {
        this.e_stat = "1";
        this.e_icode = "1";
        this.e_ifun = "0";
        this.e_valC = "0";
        this.e_valA = "0";
        this.e_valB = "0";
        this.e_dstE = "f";
        this.e_dstM = "f";
        this.e_srcA = "f";
        this.e_srcB = "f";
      }
    });
  }

  getMreg() {
    this.mregSubscription = this.cpuService.getMreg().subscribe(mreg => {
      if (mreg) {
        this.mreg = mreg;
        this.m_stat = mreg.stat.state.toString(16);
        this.m_icode = mreg.icode.state.toString(16);
        this.m_cnd = mreg.Cnd.state.toString(16);
        this.m_valE = mreg.valE.state.toUnsigned().toString(16);
        this.m_valA = mreg.valA.state.toUnsigned().toString(16);
        this.m_dstE = mreg.dstE.state.toString(16);
        this.m_dstM = mreg.dstM.state.toString(16);
        this.setColor();
      } else {
        this.m_stat = "1";
        this.m_icode = "1";
        this.m_cnd = "0";
        this.m_valE = "0";
        this.m_valA = "0";
        this.m_dstE = "f";
        this.m_dstM = "f";
      }
    });
  }

  getWreg() {
    this.wregSubscription = this.cpuService.getWreg().subscribe(wreg => {
      if (wreg) {
        this.wreg = wreg;
        this.w_stat = wreg.stat.state.toString(16);
        this.w_icode = wreg.icode.state.toString(16);
        this.w_valE = wreg.valE.state.toUnsigned().toString(16);
        this.w_valM = wreg.valM.state.toUnsigned().toString(16);
        this.w_dstE = wreg.dstE.state.toString(16);
        this.w_dstM = wreg.dstM.state.toString(16);
        this.setColor();
      } else {
        this.w_stat = "1";
        this.w_icode = "1";
        this.w_valE = "0";
        this.w_valM = "0";
        this.w_dstE = "f";
        this.w_dstM = "f";
      }
    });
  }

  /*
  * setColor
  * sets the coloring for the pipeline registers
  */
  setColor() {
    this.f_state = this.cpuService.getFColor();
    this.d_state = this.cpuService.getDColor();
    this.e_state = this.cpuService.getEColor();
    this.m_state = this.cpuService.getMColor();
    this.w_state = this.cpuService.getWColor();
  }

  /*
  * ngOnDestroy
  * unsubscribes all subcriptions to prevent memory leaks
  * happens when the pipeline reg component is destroyed
  */
  ngOnDestroy() {
    this.fpredPCsubsription.unsubscribe();
    this.dregSubscription.unsubscribe();
    this.eregSubscription.unsubscribe();
    this.mregSubscription.unsubscribe();
    this.wregSubscription.unsubscribe();
  }
}
