import { Component, OnInit } from '@angular/core';
import { ParserService } from '../../services/parser/parser.service';

@Component({
  selector: 'app-buttons',
  templateUrl: './buttons.component.html',
  styleUrls: ['./buttons.component.css']
})
export class ButtonsComponent implements OnInit {
  fileContent: string[] = [];

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
      for (let line of lines) {
        this.fileContent.push(line);
        this.parserService.parse(line);
      }
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
