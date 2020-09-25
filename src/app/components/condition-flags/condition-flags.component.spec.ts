import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConditionFlagsComponent } from './condition-flags.component';

describe('ConditionFlagsComponent', () => {
  let component: ConditionFlagsComponent;
  let fixture: ComponentFixture<ConditionFlagsComponent>;

  beforeEach(async(() => {
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
