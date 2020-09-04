import { Component, OnInit } from '@angular/core';
import { ParserService } from '../../services/parser/parser.service';
import { Line } from '../../models/Line';

@Component({
  selector: 'app-buttons',
  templateUrl: './buttons.component.html',
  styleUrls: ['./buttons.component.css']
})
export class ButtonsComponent implements OnInit {
  fileContent: Line[] = [];
  loadComponent: boolean = false;

  constructor(private parserService: ParserService) { }

  ngOnInit() {
  }

  onFileSelect(input: HTMLInputElement): void {
    const file = input.files[0];
    if (!file) return;
    if (file.name.split(".")[1] !== "yo") {
      alert('File type is not supported! Please upload a .yo file');
      input.value = "";
      this.fileContent = [];
      return;
    }

    let fileReader = new FileReader();
    fileReader.onload = (e) => {
      let lines = (fileReader.result as string).split(/[\r\n]+/g);
      let index = 0;
      for (let line of lines) {
        if (line[0] == "0") {
          index = this.fileContent.push({
            textLine: line,
            isAnAddress: true,
            isCurrent: false,
          }) - 1;
          this.parserService.parse(line);
        } else {
          index = this.fileContent.push({
            textLine: line,
            isAnAddress: false,
            isCurrent: false,
          }) - 1;
        }
        console.log(index);
      }
      if (this.fileContent[0].isAnAddress) {
        this.fileContent[0].isCurrent = true;
        this.parserService.setCurrentLine(this.fileContent[0]);
        this.parserService.setCurrentIndex(0);
      }
      this.parserService.setFileContent(this.fileContent);
      this.loadComponent = true;
    }
    fileReader.readAsText(file);
  }

  onClickContinue(): void {

  }

  onClickStep(): void {

  }

  onClickReset(): void {

  }
}
