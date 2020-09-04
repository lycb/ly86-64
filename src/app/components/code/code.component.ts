import { Component, Input, OnInit } from '@angular/core';
import { ParserService } from '../../services/parser/parser.service';
import { Line } from '../../models/Line';

@Component({
  selector: 'app-code',
  templateUrl: './code.component.html',
  styleUrls: ['./code.component.css'],
})

export class CodeComponent implements OnInit {
  @Input() fileContent: Line[];	
  
  constructor(private parserService: ParserService) { }

  ngOnInit() {
  }
}
