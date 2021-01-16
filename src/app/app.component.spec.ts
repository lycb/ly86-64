import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { ClockCycleComponent } from './components/clock-cycle/clock-cycle.component';
import { RegistersComponent } from './components/registers/registers.component';
import { ButtonsComponent } from './components/buttons/buttons.component';
import { CodeComponent } from './components/code/code.component';
import { PipelineRegComponent } from './components/pipeline-reg/pipeline-reg.component';
import { ConditionFlagsComponent } from './components/condition-flags/condition-flags.component';
import { ControlLogicComponent } from './components/control-logic/control-logic.component';

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent,
        ClockCycleComponent,
        RegistersComponent,
        ButtonsComponent,
        CodeComponent,
        PipelineRegComponent,
        ConditionFlagsComponent,
        ControlLogicComponent,
      ],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'LY86-64'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('LY86-64');
  });
});
