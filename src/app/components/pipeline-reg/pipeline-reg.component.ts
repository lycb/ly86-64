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

  f_predPC: string;
  ereg: E;

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
  m_ifun: string;
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
    this.m_ifun = "0";
    this.m_valE = "0";
    this.m_valA = "0";
    this.m_dstE = "f";
    this.m_dstM = "f";

    this.w_stat = "1";
    this.w_icode = "1";
    this.w_ifun = "0";
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
      } else {
        this.f_predPC = "error";
      }
    });
  }

  getDreg() {
    this.dregSubscription = this.cpuService.getDreg().subscribe(dreg => {
      if (dreg) {
        this.d_stat = dreg.stat.input.toString(16);
        this.d_icode = dreg.icode.input.toString(16);
        this.d_ifun = dreg.ifun.input.toString(16);
        this.d_rA = dreg.rA.input.toString(16);
        this.d_rB = dreg.rB.input.toString(16);
        this.d_valC = dreg.valC.input.toString(16);
        this.d_valP = dreg.valP.input.toString(16);
      }
    })
  }

  getEreg() {
    this.eregSubscription = this.cpuService.getEreg().subscribe(ereg => {
      if (ereg) {
        this.ereg = ereg;
        this.e_stat = ereg.stat.input.toString(16);
        this.e_icode = ereg.icode.input.toString(16);
        this.e_ifun = ereg.ifun.input.toString(16);
        this.e_valC = ereg.valC.input.toString(16);
        this.e_valA = ereg.valA.input.toString(16);
        this.e_valB = ereg.valB.input.toString(16);
        this.e_dstE = ereg.dstE.input.toString(16);
        this.e_dstM = ereg.dstM.input.toString(16);
        this.e_srcA = ereg.srcA.input.toString(16);
        this.e_srcB = ereg.srcB.input.toString(16);
        return true;
      } 
    })
  }

  ngOnDestroy() {
    this.fpredPCsubsription.unsubscribe();
    this.dregSubscription.unsubscribe();
    this.eregSubscription.unsubscribe();
  }
}
