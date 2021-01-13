import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ButtonsComponent } from './buttons.component';
import { ParserService } from '../../services/parser/parser.service';

describe('ButtonsComponent', () => {
  let component: ButtonsComponent;
  let parserService: ParserService;
  let fixture: ComponentFixture<ButtonsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ButtonsComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ButtonsComponent);
    component = fixture.componentInstance;
    parserService = TestBed.inject(ParserService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call the onClickStep every time the step button gets clicked', fakeAsync(() => {
    spyOn(component, 'onClickStep');
    fixture.debugElement.query(By.css('.step-button')).triggerEventHandler('click', null);
    expect(component.onClickStep).toHaveBeenCalled();
  }));

  it('should call the onClickContinue every time the continue button gets clicked', fakeAsync(() => {
    spyOn(component, 'onClickContinue');
    fixture.debugElement.query(By.css('.continue-button')).triggerEventHandler('click', null);
    expect(component.onClickContinue).toHaveBeenCalled();
  }));

  it('should call the onFileSelect every time the choose file button gets clicked', () => {
    spyOn(component, 'onFileSelect');
    let input = fixture.debugElement.query(By.css('.file-upload-input')).nativeElement;
    input.dispatchEvent(new Event('change'));
    expect(component.onFileSelect).toHaveBeenCalled();
  });

  it('should call the onClickReset every time the reset button gets clicked', fakeAsync(() => {
    spyOn(component, 'onClickReset');
    fixture.debugElement.query(By.css('.reset-button')).triggerEventHandler('click', null);
    expect(component.onClickReset).toHaveBeenCalled();
  }));

  it('if components have not load then buttons should be disabled', () => {
    component.loadComponent = false;
    fixture.detectChanges();
    expect(fixture.debugElement.nativeElement
      .querySelector('.step-button').disabled).toBeTruthy();
    expect(fixture.debugElement.nativeElement
      .querySelector('.continue-button').disabled).toBeTruthy();
    expect(fixture.debugElement.nativeElement
      .querySelector('.reset-button').disabled).toBeTruthy();
  });

  it('if components have loadrf then buttons should not be disabled', () => {
    component.loadComponent = true;
    fixture.detectChanges();
    expect(fixture.debugElement.nativeElement
      .querySelector('.step-button').disabled).toBeFalsy();
    expect(fixture.debugElement.nativeElement
      .querySelector('.continue-button').disabled).toBeFalsy();
    expect(fixture.debugElement.nativeElement
      .querySelector('.reset-button').disabled).toBeFalsy();
  });
});
