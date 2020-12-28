import { Component, OnInit } from '@angular/core';
import { CpuService } from '../../services/cpu/cpu.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-control-logic',
  templateUrl: './control-logic.component.html',
  styleUrls: ['./control-logic.component.css']
})
export class ControlLogicComponent implements OnInit {
  logic: string;
  logicSubscription: Subscription;

  constructor(private cpuService: CpuService) {
    this.logic = ""

    this.getLogic();
  }

  ngOnInit(): void {

  }

  getLogic() {
    this.logicSubscription = this.cpuService.getLogic().subscribe(value => {
      if (value) {
        this.logic = value;
      } else {
        this.logic = "";
      }
    });
  }

  ngOnDestroy() {
    this.logicSubscription.unsubscribe();
  }
}
