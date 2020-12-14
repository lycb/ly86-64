import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ClockCycleComponent } from './components/clock-cycle/clock-cycle.component';
import { RegistersComponent } from './components/registers/registers.component';
import { ButtonsComponent } from './components/buttons/buttons.component';
import { CodeComponent } from './components/code/code.component';
import { PipelineRegComponent } from './components/pipeline-reg/pipeline-reg.component';
import { ConditionFlagsComponent } from './components/condition-flags/condition-flags.component';

@NgModule({
  declarations: [
    AppComponent,
    ClockCycleComponent,
    RegistersComponent,
    ButtonsComponent,
    CodeComponent,
    PipelineRegComponent,
    ConditionFlagsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
