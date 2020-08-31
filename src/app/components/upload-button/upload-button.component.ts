import { Component, OnInit } from '@angular/core';
import { ParserService } from '../../services/parser/parser.service';

@Component({
  selector: 'app-upload-button',
  templateUrl: './upload-button.component.html',
  styleUrls: ['./upload-button.component.css']
})
export class UploadButtonComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  // line by line array to parse
  fileContent: string[] = [];

  onFileSelect(input: HTMLInputElement): void {
    const file = input.files[0];
    if (!file) return;
    if (file.name.split(".")[1] !== "yo") {
    	alert('File type is not supported! Please upload a .yo file');
      return;
    }

    let fileReader = new FileReader();
    fileReader.onload = (e) => {
      let lines = (fileReader.result as string).split(/[\r\n]+/g);
      for (let line of lines) {
        if (line[0] == "0") {
          this.fileContent.push(line);
        }
      }
    }
    fileReader.readAsText(file);
  }

}
