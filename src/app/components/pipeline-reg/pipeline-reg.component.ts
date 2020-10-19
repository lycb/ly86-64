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
  constructor(private cpuService: CpuService) { 
    this.subscription = this.cpuService.getPredPC().subscribe(pc => {
      if (pc) {
        this.f_predPC = pc;
      } else {
        this.f_predPC = 0;
      }
    });
  }

  ngOnInit() {
    this.f_state = "NA";
    this.d_state = "NA";
    this.e_state = "NA";
    this.m_state = "NA";
    this.w_state = "NA";
  }
}
