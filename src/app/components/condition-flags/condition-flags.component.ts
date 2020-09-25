import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-condition-flags',
  templateUrl: './condition-flags.component.html',
  styleUrls: ['./condition-flags.component.css']
})
export class ConditionFlagsComponent implements OnInit {
	OF: number;
	SF: number;
	ZF: number;

  constructor() { 
  	this.SF = 0;
  	this.OF = 0;
  	this.ZF = 0;
  }

  ngOnInit() {
  }

}
