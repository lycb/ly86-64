import { Component } from '@angular/core';
import { ClockCycleComponent } from './components/clock-cycle/clock-cycle.component';
import { RegistersComponent } from './components/registers/registers.component';
import { ButtonsComponent } from './components/buttons/buttons.component';
import { CodeComponent } from './components/code/code.component';
import { PipelineRegComponent } from './components/pipeline-reg/pipeline-reg.component';
import { ConditionFlagsComponent } from './components/condition-flags/condition-flags.component';
import { ControlLogicComponent } from './components/control-logic/control-logic.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'LY86-64';
}
