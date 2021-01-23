import { Component, Input, OnInit } from '@angular/core';
import { ParserService } from '../../services/parser/parser.service';
import { CpuService } from '../../services/cpu/cpu.service';
import { Line } from '../../models/Line';

@Component({
  selector: 'app-code',
  templateUrl: './code.component.html',
  styleUrls: ['./code.component.css'],
})

export class CodeComponent implements OnInit {
  // display the main code chunk
  @Input() fileContent: Line[];	
  @Input() hold: boolean;
  @Input() fstall: boolean;
  @Input() reset: boolean;

  constructor(private cpuService: CpuService) { }

  ngOnInit() {
  }
}
