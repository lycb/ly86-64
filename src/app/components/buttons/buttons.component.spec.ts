import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ButtonsComponent } from './buttons.component';
import { CodeComponent } from './../code/code.component';
import { ClockCycleComponent } from './../clock-cycle/clock-cycle.component';
import { AddressLine } from '../../models/AddressLine';
import { ParserService } from '../../services/parser/parser.service';
import Long from 'long';

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

  it('onClickStep -- should call function', fakeAsync(() => {
    spyOn(component, 'onClickStep');
    fixture.debugElement.query(By.css('.step-button')).triggerEventHandler('click', null);
    
    expect(component.onClickStep).toHaveBeenCalled();
  }));

  it('onClickContinue -- should call function', fakeAsync(() => {
    spyOn(component, 'onClickContinue');
    fixture.debugElement.query(By.css('.continue-button')).triggerEventHandler('click', null);
    
    expect(component.onClickContinue).toHaveBeenCalled();
  }));

  it('onFileSelect -- should call function', () => {
    spyOn(component, 'onFileSelect');
    let input = fixture.debugElement.query(By.css('.file-upload-input')).nativeElement;
    input.dispatchEvent(new Event('change'));
    
    expect(component.onFileSelect).toHaveBeenCalled();
  });

  it('onClickReset -- should call function', fakeAsync(() => {
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

  it('isFileExtensionYo -- return true if file extension is .yo', () => {
    let file = new File([''], 'filename.yo');
    spyOn(component, 'isFileExtensionYo').and.callThrough();

    expect(component.isFileExtensionYo(file)).toBeTruthy();
  });

  it('isFileExtensionYo -- return false if file extension is not .yo', () => {
    spyOn(component, 'isFileExtensionYo').and.callThrough();
    spyOn(window, 'alert');

    expect(component.isFileExtensionYo(new File([''], 'filename.txt'))).toBeFalsy();
    expect(component.isFileExtensionYo(new File([''], 'filename.pdf'))).toBeFalsy();
    expect(component.isFileExtensionYo(new File([''], 'filename'))).toBeFalsy();
    expect(component.isFileExtensionYo(new File([''], 'filename.docx'))).toBeFalsy();
    expect(window.alert).toHaveBeenCalledWith('File type is not supported! Please upload a .yo file')
  });

  it('setFirstAddressCurrent -- sets first address to be current', () => {
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

  
  it('nextCurrentLine -- set next address line current', () => {
    const mockFileContent =
      [
        {
          'id': 0,
          'textLine': '',
          'isAnAddress': true,
          'isCurrent': true,
          'parsedLine': {
            'address': 1,
            'instruction': '10'
          }
        },
        {
          'id': 1,
          'textLine': '',
          'isAnAddress': true,
          'isCurrent': false,
          'parsedLine': {
            'address': 2,
            'instruction': '10'
          }
        }
      ];

     parserService.setFileContent(mockFileContent);
     parserService.setCurrent(mockFileContent[0])
     component.fileContent = parserService.getFileContent();
     component.nextCurrentLine();

     expect(parserService.getCurrentIndex()).toBe(1);
     expect(parserService.getFileContent()[0].isCurrent).toBeFalsy();
  });

  it('findNextIndex -- find next index that has an instruction', () => {
    const mockFileContent =
      [
        {
          'id': 0,
          'textLine': '',
          'isAnAddress': true,
          'isCurrent': true,
          'parsedLine': {
            'address': 1,
            'instruction': '10'
          }
        },
        {
          'id': 1,
          'textLine': '',
          'isAnAddress': false,
          'isCurrent': false,
          'parsedLine': null,
        },
        {
          'id': 2,
          'textLine': '',
          'isAnAddress': true,
          'isCurrent': false,
          'parsedLine': {
            'address': 3,
            'instruction': '10'
          }
        },
      ];

     parserService.setFileContent(mockFileContent);
     parserService.setCurrent(mockFileContent[0])
     component.fileContent = mockFileContent;
     component.freg.getPredPC().setInput(new Long(3, 0, false));
     component.freg.getPredPC().normal();
     let nextIndex = component.findNextIndex();

     expect(nextIndex).toBe(2)
  });
});
