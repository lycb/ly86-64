import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PipelineRegComponent } from './pipeline-reg.component';

describe('PipelineRegComponent', () => {
  let component: PipelineRegComponent;
  let fixture: ComponentFixture<PipelineRegComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PipelineRegComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PipelineRegComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
