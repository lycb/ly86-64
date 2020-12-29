import { Component, OnInit } from '@angular/core';
import { CpuService } from '../../services/cpu/cpu.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-control-logic',
  templateUrl: './control-logic.component.html',
  styleUrls: ['./control-logic.component.css']
})
export class ControlLogicComponent implements OnInit {
  Flogic: string;
  Dlogic: string;
  Elogic: string;
  logicSubscription: Subscription;

  constructor(private cpuService: CpuService) {
    this.Flogic = "";
    this.Dlogic = "";
    this.Elogic = "";

    this.getLogic();
  }

  ngOnInit(): void {

  }

  getLogic() {
    this.logicSubscription = this.cpuService.getLogic().subscribe(value => {
      if (value) {
        this.Flogic = value[0];
        this.Dlogic = value[1];
        this.Elogic = value[2];
      } else {
        this.Flogic = "";
        this.Dlogic = "";
        this.Elogic = "";
      }
    });
  }

  ngOnDestroy() {
    this.logicSubscription.unsubscribe();
  }
}
