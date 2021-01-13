import { TestBed } from '@angular/core/testing';

import { ParserService } from './parser.service';

describe('ParserService', () => {
  let service: ParserService
  beforeEach(() => TestBed.configureTestingModule({}));

  beforeEach(() => {
    service = TestBed.get(ParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('setCurrent -- throw error for non-address files', () => {
    const mockFileContent =
      [
        {
          'id': 0,
          'textLine': '',
          'isAnAddress': false,
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

    service.setFileContent(mockFileContent);
    expect(function() {
      service.setCurrent(mockFileContent[0]);
    }).toThrow(new Error('cannot set current on non-address lines'));
  });

  it('setFileContent -- with no changes to mock file content', () => {
    const mockFileContent =
      [
        {
          'id': 0,
          'textLine': '',
          'isAnAddress': false,
          'isCurrent': false,
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

    service.setFileContent(mockFileContent);
    expect(service.getFileContent()).toBe(mockFileContent);
  });

  it('setFileContent -- with changes', () => {
    const mockFileContent =
      [
        {
          'id': 0,
          'textLine': '',
          'isAnAddress': true,
          'isCurrent': false,
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

    service.setFileContent(mockFileContent);
    expect(service.getFileContent()[0].isCurrent).toBeFalsy();
    service.setCurrent(mockFileContent[0]);
    expect(service.getFileContent()[0].isCurrent).toBeTruthy();
  });

  it('getCurrentIndex -- returns current index', () => {
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

    service.setFileContent(mockFileContent);
    service.setCurrent(mockFileContent[0])
    expect(service.getCurrentIndex()).toBe(0);
    expect(service.getFileContent()[0].isCurrent).toBeTruthy();
    expect(service.getFileContent()[1].isCurrent).toBeFalsy();

    service.setCurrent(mockFileContent[1])
    expect(service.getCurrentIndex()).toBe(1);
    expect(service.getFileContent()[0].isCurrent).toBeFalsy();
    expect(service.getFileContent()[1].isCurrent).toBeTruthy();
  });

  it('getCurrentLine -- returns to current line', () => {
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

    service.setFileContent(mockFileContent);
    service.setCurrent(mockFileContent[0])
    expect(service.getCurrentLine()).toBe(mockFileContent[0]);
    expect(service.getFileContent()[0].isCurrent).toBeTruthy();
    expect(service.getFileContent()[1].isCurrent).toBeFalsy();

    service.setCurrent(mockFileContent[1])
    expect(service.getCurrentLine()).toBe(mockFileContent[1]);
    expect(service.getFileContent()[0].isCurrent).toBeFalsy();
    expect(service.getFileContent()[1].isCurrent).toBeTruthy();
  });

  it('should parse', () => {
    const mockLine = "0x001: 10                   |       nop";
    const mockParsedLine = '{"address":1,"instruction":"10"}';
    
    expect(JSON.stringify(service.parse(mockLine))).toBe(mockParsedLine)
  });
});

