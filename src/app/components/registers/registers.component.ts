import { Component, OnInit } from '@angular/core';
import { ParserService } from '../../services/parser/parser.service';
import { RegisterService } from '../../services/register/register.service';
import { Register } from '../../models/Register';

@Component({
  selector: 'app-registers',
  templateUrl: './registers.component.html',
  styleUrls: ['./registers.component.css']
})
export class RegistersComponent implements OnInit {
	headers = ["name", "value"];
	register: Register[];
  constructor(private parserService: ParserService, private registerService: RegisterService) { }

  ngOnInit() {
  	this.register = this.registerService.getRegisters();
  }
}
