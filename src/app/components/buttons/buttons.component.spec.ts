import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ButtonsComponent } from './buttons.component';
import { CodeComponent } from './../code/code.component';
import { ClockCycleComponent } from './../clock-cycle/clock-cycle.component';
import { AddressLine } from '../../models/AddressLine';
import { ParserService } from '../../services/parser/parser.service';

describe('ButtonsComponent', () => {
  let component: ButtonsComponent;
  let parserService: ParserService;
  let fixture: ComponentFixture<ButtonsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
      ButtonsComponent,
      ClockCycleComponent,
      CodeComponent
      ]
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

  it('if components have loaded then buttons should not be disabled', () => {
    component.loadComponent = true;
    fixture.detectChanges();
    expect(fixture.debugElement.nativeElement
      .querySelector('.step-button').disabled).toBeFalsy();
    expect(fixture.debugElement.nativeElement
      .querySelector('.continue-button').disabled).toBeFalsy();
    expect(fixture.debugElement.nativeElement
      .querySelector('.reset-button').disabled).toBeFalsy();
  });

  it('should set current index to 0 if setFirstAddressCurrent is called', () => {
    const mockFileContent =
      [
        {
          'id': 0,
          'textLine': '',
          'isAnAddress': true,
          'isCurrent': false,
          'parsedLine': {
            'address': 1,
            'instruction': ''
          }
        },
        {
          'id': 1,
          'textLine': '',
          'isAnAddress': true,
          'isCurrent': true,
          'parsedLine': {
            'address': 2,
            'instruction': ''
          }
        }
      ];

     parserService.setFileContent(mockFileContent);
     parserService.setCurrent(mockFileContent[1]);
     component.fileContent = parserService.getFileContent();
     component.setFirstAddressCurrent();
     expect(parserService.getCurrentIndex()).toBe(0);
     expect(parserService.getFileContent()[1].isCurrent).toBeFalsy();
  });

  it('should throw error if trying to set current on a line that is not an address', () => {
    const mockFileContent =
      [
        {
          'id': 0,
          'textLine': '',
          'isAnAddress': false,
          'isCurrent': true,
          'parsedLine': {
            'address': 1,
            'instruction': ''
          }
        },
        {
          'id': 1,
          'textLine': '',
          'isAnAddress': true,
          'isCurrent': false,
          'parsedLine': {
            'address': 2,
            'instruction': ''
          }
        }
      ];

     parserService.setFileContent(mockFileContent);
     component.fileContent = parserService.getFileContent();
     expect(function() {
       parserService.setCurrent(mockFileContent[0]); 
     }).toThrow(new Error('cannot set current on non-address lines'));
  });
});
