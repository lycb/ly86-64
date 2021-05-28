import { Component } from '@angular/core';
import{Router, NavigationEnd} from '@angular/router';
import { ClockCycleComponent } from './components/clock-cycle/clock-cycle.component';
import { RegistersComponent } from './components/registers/registers.component';
import { ControlComponent } from './components/control/control.component';
import { CodeComponent } from './components/code/code.component';
import { PipelineRegComponent } from './components/pipeline-reg/pipeline-reg.component';
import { ConditionFlagsComponent } from './components/condition-flags/condition-flags.component';
import { ControlLogicComponent } from './components/control-logic/control-logic.component';

declare let ga: Function;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'LY86-64';
  constructor(public router: Router){   
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        ga('set', 'page', event.urlAfterRedirects);
        ga('send', 'pageview');
      }
    });
  }
}
