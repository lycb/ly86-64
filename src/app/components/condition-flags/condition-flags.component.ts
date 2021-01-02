import { Component, OnInit } from '@angular/core';
import { CpuService } from '../../services/cpu/cpu.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-condition-flags',
  templateUrl: './condition-flags.component.html',
  styleUrls: ['./condition-flags.component.css']
})
export class ConditionFlagsComponent implements OnInit {
	OF: number;
	SF: number;
	ZF: number;
  ccSubscription: Subscription;

  constructor(private cpuService: CpuService) { 
  	this.SF = 0;
  	this.OF = 0;
  	this.ZF = 0;

    this.getCC();
  }

  ngOnInit() {
  }

  getCC() {
    this.ccSubscription = this.cpuService.getCC().subscribe(value => {
      if (value) {
        this.OF = value[0];
        this.SF = value[1];
        this.ZF = value[2];
      } else {
        this.SF = 0;
        this.OF = 0;
        this.ZF = 0;
      }
    });
  }

  ngOnDestroy() {
    this.ccSubscription.unsubscribe();
  }
}
