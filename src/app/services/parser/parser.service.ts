import { Injectable } from '@angular/core';
import { Line } from './line';

@Injectable({
  providedIn: 'root'
})
export class ParserService {

  lineArray: Line[] = [];
  fileContent: string[] = [];

  constructor() { }

  parse(line: string) {
    var parts = line.match(/^\s*0[xX]([0-9a-fA-F]+)\s*:\s*([0-9a-fA-F]*)\s*\|.*$/);
    
    if (parts != null) {
        this.lineArray.push({
          address: parseInt(parts[1], 16),
          instruction: parts[2]
        });
    }
  }

  getLineArray(): Line[] {
    return this.lineArray;
  }

  setFileContent(content: string[]): void {
    this.fileContent = content;
  }

  getFileContent(): string[] {
    return this.fileContent;
  }
}
