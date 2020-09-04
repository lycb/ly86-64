import { Injectable } from '@angular/core';
import { AddressLine } from '../../models/AddressLine';
import { Line } from '../../models/Line';


@Injectable({
  providedIn: 'root'
})

export class ParserService {

  lineArray: AddressLine[] = [];
  fileContent: Line[] = [];
  currentLine: Line;
  currentIndex: number;

  constructor() { }

  parse(line: string) {
    var parts = line.match(/^\s*0[xX]([0-9a-fA-F]+)\s*:\s*([0-9a-fA-F]*)\s*\|.*$/);
    
    if (parts != null) {
        this.lineArray.push({
          address: parseInt(parts[1], 16),
          instruction: parts[2],
        });
    }
  }

  getAddressLineArray(): AddressLine[] {
    return this.lineArray;
  }

  setFileContent(content: Line[]): void {
    this.fileContent = content;
  }

  getFileContent(): Line[] {
    console.log(this.fileContent)
    return this.fileContent;
  }

  setCurrentLine(newLine: Line): void {
    this.currentLine = newLine;
  }

  getCurrentLine(): Line {
    return this.currentLine;
  }

  setCurrentIndex(index: number): void {
    this.currentIndex = index;;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

}
