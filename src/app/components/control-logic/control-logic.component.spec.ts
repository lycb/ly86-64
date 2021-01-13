import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlLogicComponent } from './control-logic.component';

describe('ControlLogicComponent', () => {
  let component: ControlLogicComponent;
  let fixture: ComponentFixture<ControlLogicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ControlLogicComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlLogicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
