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

  subscription: Subscription;

  f_predPC: number;

  d_stat: number;
  d_icode: number;
  d_ifun: number;
  d_rA: number;
  d_rB: number;
  d_valC: number;
  d_valP: number;

  e_stat: number;
  e_icode: number;
  e_ifun: number;
  e_valC: number;
  e_valA: number;
  e_valB: number;
  e_dstE: number;
  e_dstM: number;
  e_srcA: number;
  e_srcB: number;

  m_stat: number;
  m_icode: number;
  m_ifun: number;
  m_valE: number;
  m_valA: number;
  m_dstE: number;
  m_dstM: number;

  w_stat: number;
  w_icode: number;
  w_ifun: number;
  w_valE: number;
  w_valM: number;
  w_dstE: number;
  w_dstM: number;

  constructor(private cpuService: CpuService) { 
    this.f_predPC = 0;
    this.subscription = this.cpuService.getPredPC().subscribe(pc => {
      if (pc) {
        this.f_predPC = pc;
      } else {
        this.f_predPC = 0;
      }
    });

    this.d_stat = 0;
    this.d_icode = 0;
    this.d_ifun = 0;
    this.d_rA = 0;
    this.d_rB = 0;
    this.d_valC = 0;
    this.d_valP = 0;

    this.e_stat = 0;
    this.e_icode = 0;
    this.e_ifun = 0;
    this.e_valC = 0;
    this.e_valA = 0;
    this.e_valB = 0;
    this.e_dstE = 0;
    this.e_dstM = 0;
    this.e_srcA = 0;
    this.e_srcB = 0;

    this.m_stat = 0;
    this.m_icode = 0;
    this.m_ifun = 0;
    this.m_valE = 0;
    this.m_valA = 0;
    this.m_dstE = 0;
    this.m_dstM = 0;

    this.w_stat = 0;
    this.w_icode = 0;
    this.w_ifun = 0;
    this.w_valE = 0;
    this.w_valM = 0;
    this.w_dstE = 0;
    this.w_dstM = 0;

  }

  ngOnInit() {
    this.f_state = "NA";
    this.d_state = "NA";
    this.e_state = "NA";
    this.m_state = "NA";
    this.w_state = "NA";
  }
}
