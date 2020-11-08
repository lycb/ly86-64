import { Component, OnInit } from '@angular/core';
import { ParserService } from '../../services/parser/parser.service';
import { CpuService } from '../../services/cpu/cpu.service';
import { Line } from '../../models/Line';
import { MemoryFunc } from "../../models/Memory";
import { AddressLine } from "../../models/AddressLine"; 
import { F, D, E, M, W } from "../../models/PipeReg";

@Component({
  selector: 'app-buttons',
  templateUrl: './buttons.component.html',
  styleUrls: ['./buttons.component.css']
})
export class ButtonsComponent implements OnInit {
  fileContent: Line[];
  counter: number;
  loadComponent: boolean;
  nextLine: boolean;

  freg: F;
  dreg: D;
  ereg: E;
  mreg: M;
  wreg: W;

  constructor(private parserService: ParserService, private cpuService: CpuService) {
  }

  ngOnInit() {
    this.counter = 0;
    this.loadComponent = false;
    this.nextLine = true;

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

  onClickContinue(): void {

  }

  onClickStep(): void {
    var current = this.parserService.getCurrentLine();
    var nextId = current.id + 1;
    if (current.id < this.fileContent.length && nextId < this.fileContent.length) {
      if (current.parsedLine.instruction != "") {
        this.cpuService.doFetchStage(current, this.freg, this.dreg, this.ereg, this.mreg, this.wreg);
      }
      this.nextCurrentLine(current);
    }
  }

  onClickReset(): void {
    this.setFirstAddressCurrent();
    this.counter = 0;
    this.cpuService.resetValues();
  }

  setFirstAddressCurrent(): void {
    for (let i = 0; i < this.fileContent.length; i++) {
      if (this.fileContent[i].isAnAddress) {
        this.fileContent[i].isCurrent = true;
        this.parserService.setCurrent(this.fileContent[i]);
        break;
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
  * return true if there is a next "current" line to highlight
  * return false if there isn't another line to read (i.e. EOF)
  */
  nextCurrentLine(current: Line): void {
    for (let i = current.id + 1; i < this.fileContent.length; i++) {
      if (this.fileContent[i].parsedLine != null) {
        this.fileContent[i].isCurrent = true;
        this.parserService.setCurrent(this.fileContent[i]);
        //increment the clock-cycle
        this.counter++;
        break;
      } 
    }
  }

  loadline(line: AddressLine): void {
    let memory = MemoryFunc.getInstance();
    let bytes = line.instruction.length / 2;
    let position = 0;
    let address = line.address;
    while(bytes > 0) {
      let value = parseInt(line.instruction.substring(position, position + 2) , 16);
      position += 2;
      bytes--;
      memory.putByte(value, address);
      address++;
    }
  }

  readFileAsText(file: File): void {

  }
}
