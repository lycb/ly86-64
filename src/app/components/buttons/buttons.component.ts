import { Component, OnInit } from '@angular/core';
import { ParserService } from '../../services/parser/parser.service';
import { CpuService } from '../../services/cpu/cpu.service';
import { UtilsService } from '../../services/utils/utils.service';
import { MemoryService } from '../../services/memory/memory.service';
import { Line } from '../../models/Line';
import { AddressLine } from "../../models/AddressLine";
import { F, D, E, M, W } from "../../models/PipeReg";
import Long from 'long';

@Component({
  selector: 'app-buttons',
  templateUrl: './buttons.component.html',
  styleUrls: ['./buttons.component.css']
})
export class ButtonsComponent implements OnInit {
  fileContent: Line[];
  counter: number;
  stop: boolean;
  loadComponent: boolean;
  nextLine: boolean;
  isFirstAddressCurrent: boolean;

  freg: F;
  dreg: D;
  ereg: E;
  mreg: M;
  wreg: W;

  constructor(private parserService: ParserService,
    private cpuService: CpuService,
    private utilsService: UtilsService,
    private memoryService: MemoryService) {
  }

  ngOnInit() {
    this.counter = 0;
    this.stop = false;
    this.loadComponent = false;
    this.nextLine = true;
    this.isFirstAddressCurrent = false;

    this.freg = new F();
    this.dreg = new D();
    this.ereg = new E();
    this.mreg = new M();
    this.wreg = new W();
  }

  onFileSelect(input: HTMLInputElement): void {
    this.fileContent = [];
    const file = input.files[0];
    if (!file) return;

    if (!this.isFileExtensionYo(file)) {
      input.value = "";
      this.parserService.setFileContent(this.fileContent);
      return;
    }
    this.readFileAsText(file);
  }

  onClickContinue(): void {

  }

  onClickStep(): void {
    this.isFirstAddressCurrent = false;
    var current = this.parserService.getCurrentLine();
    var nextId = current.id + 1;
    if (current.id < this.fileContent.length && nextId < this.fileContent.length) {
      if (current.parsedLine.instruction != "" && !this.stop) {
          this.stop = this.cpuService.doSimulation(current, this.freg, this.dreg, this.ereg, this.mreg, this.wreg);
      }
      this.nextCurrentLine(current);
    }
  }

  onClickReset(): void {
    this.setFirstAddressCurrent();
    this.counter = 0;
    this.cpuService.resetValues(this.freg, this.dreg, this.ereg, this.mreg, this.wreg);
  }

  setFirstAddressCurrent(): void {
    if (!this.isFirstAddressCurrent) {
      for (let i = 0; i < this.fileContent.length; i++) {
        if (this.fileContent[i].isAnAddress) {
          this.fileContent[i].isCurrent = true;
          this.parserService.setCurrent(this.fileContent[i]);
          this.isFirstAddressCurrent = true;
          break;
        }
      }
    }
  }

  isFileExtensionYo(file: File): boolean {
    if (file.name.split(".")[1] !== "yo") {
      alert('File type is not supported! Please upload a .yo file');
      this.loadComponent = false;
      return false;
    }
    return true;
  }

  /*
  * nextCurrentLine --
  * return true if there is a next "current" line to highlight
  * return false if there isn't another line to read (i.e. EOF)
  */
  nextCurrentLine(current: Line): void {
    for (let i = current.id + 1; i < this.fileContent.length; i++) {
      let next = this.fileContent[i];
      if (next.parsedLine != null) {
        if (!this.cpuService.holdHighlight(this.dreg)) {
          next.isCurrent = true;
          this.parserService.setCurrent(next);
        } 
        if (next.parsedLine.address != 0 && current.parsedLine != null &&
          current.parsedLine.address != next.parsedLine.address &&
          current.parsedLine.address != 0) {
          //increment the clock-cycle
          this.counter++;
        }
        break;
      }
    }
  }

  loadline(line: AddressLine): void {
    let bytes = line.instruction.length / 2;
    let position = 0;
    let address = line.address;
    while (bytes > 0) {
      let value = parseInt(line.instruction.substring(position, position + 2), 16);
      position += 2;
      bytes--;
      this.memoryService.putByte(Long.fromNumber(value), address);
      address++;
    }
  }

  readFileAsText(file: File): void {
    let fileReader = new FileReader();
    fileReader.onload = (e) => {
      let lines = (fileReader.result as string).split(/[\r\n]+/g);
      let index = 0;
      for (let line of lines) {
        if (line[0] == "0") {
          this.fileContent.push({
            id: index,
            textLine: line,
            isAnAddress: true,
            isCurrent: false,
            parsedLine: this.parserService.parse(line),
          });
          index++;
        } else {
          this.fileContent.push({
            id: index,
            textLine: line,
            isAnAddress: false,
            isCurrent: false,
            parsedLine: null,
          });
          index++;
        }
      }
      this.setFirstAddressCurrent();
      this.parserService.setFileContent(this.fileContent);
      this.loadComponent = true;
      for (let i = 0; i < this.fileContent.length; i++) {
        if (this.fileContent[i].isAnAddress && this.fileContent[i].parsedLine.instruction !== "") {
          this.loadline(this.fileContent[i].parsedLine);
        }
      }
    }
    fileReader.readAsText(file);
  }
}
