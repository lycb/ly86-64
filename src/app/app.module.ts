import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UploadButtonComponent } from './components/upload-button/upload-button.component';
import { ClockCycleComponent } from './components/clock-cycle/clock-cycle.component';

@NgModule({
  declarations: [
    AppComponent,
    UploadButtonComponent,
    ClockCycleComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
