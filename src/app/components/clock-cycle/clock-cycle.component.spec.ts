import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClockCycleComponent } from './clock-cycle.component';

describe('ClockCycleComponent', () => {
  let component: ClockCycleComponent;
  let fixture: ComponentFixture<ClockCycleComponent>;

  beforeEach(async(() => {
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
