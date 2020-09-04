import { Component, OnInit } from '@angular/core';
import { ParserService } from '../../services/parser/parser.service';
import { Line } from '../../models/Line';

@Component({
  selector: 'app-buttons',
  templateUrl: './buttons.component.html',
  styleUrls: ['./buttons.component.css']
})
export class ButtonsComponent implements OnInit {
  fileContent: Line[];
  loadComponent: boolean = false;

  constructor(private parserService: ParserService) { }

  ngOnInit() {
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
    }
    fileReader.readAsText(file);
  }

  onClickContinue(): void {

  }

  onClickStep(): void {
    var current = this.parserService.getCurrentLine();
    if (current.id < this.fileContent.length) {
      for (let i = current.id + 1; i < this.fileContent.length; i++) {
        if (this.fileContent[i].parsedLine != null) {
          this.fileContent[i].isCurrent = true;
          this.parserService.setCurrent(this.fileContent[i]);
          break;
        }
      }
    }
  }

  onClickReset(): void {
    this.setFirstAddressCurrent();
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
}
