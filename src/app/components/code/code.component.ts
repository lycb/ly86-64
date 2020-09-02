import { Component, OnInit } from '@angular/core';
import { ParserService } from '../../services/parser/parser.service';

@Component({
  selector: 'app-code',
  templateUrl: './code.component.html',
  styleUrls: ['./code.component.css']
})
export class CodeComponent implements OnInit {
	fileContent: string[] = [];	
  
  constructor(private parserService: ParserService) { }

  ngOnInit() {
  	this.fileContent = this.parserService.getFileContent();
  }

}
