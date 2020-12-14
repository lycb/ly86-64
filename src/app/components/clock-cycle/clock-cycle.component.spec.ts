import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ClockCycleComponent } from './clock-cycle.component';

describe('ClockCycleComponent', () => {
  let component: ClockCycleComponent;
  let fixture: ComponentFixture<ClockCycleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ClockCycleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClockCycleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
