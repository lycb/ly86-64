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

    service.setFileContent(mockFileContent);
    expect(function() {
      service.setCurrent(mockFileContent[0]);
    }).toThrow(new Error('cannot set current on non-address lines'));
  });
});
