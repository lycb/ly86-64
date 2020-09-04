import { Injectable } from '@angular/core';
import { AddressLine } from '../../models/AddressLine';
import { Line } from '../../models/Line';


@Injectable({
  providedIn: 'root'
})

export class ParserService {

  fileContent: Line[] = [];
  currentLine: Line;

  constructor() { }

  parse(line: string): AddressLine {
    var parts = line.match(/^\s*0[xX]([0-9a-fA-F]+)\s*:\s*([0-9a-fA-F]*)\s*\|.*$/);
    var parsedLine: AddressLine = null;
    if (parts != null) {
        parsedLine = {
          address: parseInt(parts[1], 16),
          instruction: parts[2],
        }
    }
    return parsedLine;
  }

  setFileContent(content: Line[]): void {
    this.fileContent = content;
  }

  getFileContent(): Line[] {
    return this.fileContent;
  }

  setCurrent(line: Line[]): void {
    if (this.currentLine != undefined) {
      this.currentLine.isCurrent = false;
      this.currentLine = line;
    } else {
      this.currentLine = line;
    }
  }

  getCurrentIndex(): number {
    return this.currentLine.id;
  }

  getCurrentLine(): Line {
    return this.currentLine;
  }


}
