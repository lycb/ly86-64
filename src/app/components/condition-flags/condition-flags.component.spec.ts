import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConditionFlagsComponent } from './condition-flags.component';

describe('ConditionFlagsComponent', () => {
  let component: ConditionFlagsComponent;
  let fixture: ComponentFixture<ConditionFlagsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConditionFlagsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConditionFlagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
