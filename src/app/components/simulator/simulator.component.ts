import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-simulator',
  templateUrl: './simulator.component.html',
  styleUrls: ['./simulator.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class SimulatorComponent implements OnInit, OnDestroy {

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    document.querySelector('body').classList.add('simulator');
  }

  ngOnDestroy() {
    document.querySelector('body').classList.remove('simulator');
  }

}
