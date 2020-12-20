import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';

import { ButtonsComponent } from './buttons.component';

describe('ButtonsComponent', () => {
  let component: ButtonsComponent;
  let fixture: ComponentFixture<ButtonsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ButtonsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // it('should open the select file window', fakeAsync(() => {
  //   spyOn(component, 'onFileSelect');

  //   let button = fixture.debugElement.nativeElement.querySelector('button.file-upload-button');
  //   button.click();
  //   tick();
  //   expect(component.onFileSelect).toHaveBeenCalled(); 
  // }));
});
