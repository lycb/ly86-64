import { Component, OnInit } from '@angular/core';

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
  constructor() { 
  	this.f_state = "NA";
  	this.d_state = "NA";
  	this.e_state = "NA";
  	this.m_state = "NA";
  	this.w_state = "NA";
  }

  ngOnInit() {
  }
}
