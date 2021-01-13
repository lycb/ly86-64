import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-clock-cycle',
  templateUrl: './clock-cycle.component.html',
  styleUrls: ['./clock-cycle.component.css']
})
export class ClockCycleComponent implements OnInit {
	@Input() cycle: number;

  constructor() { }

  ngOnInit() {
  }

}
