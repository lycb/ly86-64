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
  cycle: number;
  instructionLength: number;
  stop: boolean;
  counterStop: boolean;
  loadComponent: boolean;
  isFirstAddressCurrent: boolean;
  showSelectFile: boolean;

  fstall: boolean;
  hold: boolean;

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
    this.cycle = 0;
    this.stop = false;
    this.counterStop = false;
    this.loadComponent = false;
    this.isFirstAddressCurrent = false;
    this.instructionLength = 0;
    this.showSelectFile = false;

    this.freg = new F();
    this.dreg = new D();
    this.ereg = new E();
    this.mreg = new M();
    this.wreg = new W();
  }

  /*
  * onFileSelect
  * check for file extension
  * load lines into an array -> this.fileContent
  */
  onFileSelect(): void {
    this.isFirstAddressCurrent = false;
    this.fileContent = [];
    const input = <HTMLInputElement>document.getElementById("file-input")
    const file = input.files[0];

    if (!file) return;

    if (!this.isFileExtensionYo(file)) {
      input.value = "";
      this.parserService.setFileContent(this.fileContent);
      return;
    }
    this.readFileAsText(file);
    this.onClickReset();
  }

  onClickContinue(): void {
    while (!this.stop) {
      this.onClickStep();
    }
  }

  onClickStep(): void {
    this.isFirstAddressCurrent = false;
    var current = this.parserService.getCurrentLine();
    var nextId = current.id + 1;
    if (current.id < this.fileContent.length && nextId < this.fileContent.length) {
      if (current.parsedLine.instruction != "" && !this.stop) {
        this.stop = this.cpuService.doSimulation(this.fileContent, current, this.freg, this.dreg, this.ereg, this.mreg, this.wreg);
        this.hold = this.cpuService.getHold();
        this.fstall = this.cpuService.getFstall();
      }
      this.nextCurrentLine();
    }
  }

  onClickReset(): void {
    this.setFirstAddressCurrent();
    this.cycle = 0;
    this.cpuService.reset(this.freg, this.dreg, this.ereg, this.mreg, this.wreg);

    this.cycle = 0;
    this.stop = false;
    this.counterStop = false;
    this.isFirstAddressCurrent = false;
    this.instructionLength = 0;

    this.loadlines();
  }

  onLoadSamples(): void {
    this.showSelectFile = false;
    let filename = (<HTMLInputElement>document.getElementById("dropdown")).value;
    if (filename !== "upload" && filename !== "choose") {
      let txt;
      let path = "assets/sample/yo_files/" + filename;
      var rawFile = new XMLHttpRequest();
      rawFile.open("GET", path, false);
      rawFile.onreadystatechange = function() {
        if (rawFile.status == 200 && rawFile.readyState == 4) {
          txt = rawFile.responseText;
        }
      };
      rawFile.open("GET", path, false);
      rawFile.send();
      this.isFirstAddressCurrent = false;
      this.fileContent = [];

      var blob = new Blob([txt], { type: 'text/plain' });
      var file = new File([blob], "foo.txt", {type: "text/plain"});
      
      this.readFileAsText(file);
      this.onClickReset();
    } 
    if (filename == "upload") {
      this.showSelectFile = true;
    }
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
  * nextCurrentLine
  * sets the next valid instruction to be the new current line
  */
  nextCurrentLine(): void {
    let current = this.parserService.getCurrentLine();

    let nextIndex = this.findNextIndex();

    if (nextIndex == 0) {
      nextIndex++;
    }
    for (let i = nextIndex; i < this.fileContent.length; i++) {
      let next = this.fileContent[i];
      if (next.parsedLine != null) {
        let eof = next.id >= this.instructionLength;
        if (!this.cpuService.holdHighlight(this.dreg, eof)) {
          this.parserService.setCurrent(next);
        }
      }
      if (current.parsedLine != null && current.parsedLine.address != 0 && !this.counterStop) {
        //increment the clock-cycle
        if (this.stop) this.counterStop = true;
        this.cycle++;
      }
      break;
    }
  }

  findNextIndex(): number {
    let index = 0;
    for (let i = 0; i < this.fileContent.length; i++) {
      if (this.fileContent[i].parsedLine !== null && this.fileContent[i].parsedLine.instruction !== "") {
        if (this.fileContent[i].parsedLine.address == this.freg.getPredPC().getOutput().toNumber()) {
          index = i;
          break;
        }
        index = this.parserService.getCurrentLine().id;
      }
    }
    return index;
  }

  loadlines(): void {
    for (let i = 0; i < this.fileContent.length; i++) {
      if (this.fileContent[i].isAnAddress && this.fileContent[i].parsedLine.instruction !== "") {
        this.loadline(this.fileContent[i].parsedLine);
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

          if (this.fileContent[index].parsedLine.instruction != "" && // has an instruction
            (this.fileContent[index].parsedLine.instruction[0] != "0" || // not halt or constants
              (this.fileContent[index].parsedLine.instruction[0] == "0" && this.fileContent[index].parsedLine.instruction[1] == "0"))) //is halt 
          {
            this.instructionLength++;
          }
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
      this.loadlines();
    }
    fileReader.readAsText(file);
  }
}
