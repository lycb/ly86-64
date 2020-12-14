import { Component, OnInit } from '@angular/core';
import { ParserService } from '../../services/parser/parser.service';
import { RegisterService } from '../../services/register/register.service';
import { Register } from '../../models/Register';
import Long from 'long';

@Component({
  selector: 'app-registers',
  templateUrl: './registers.component.html',
  styleUrls: ['./registers.component.css']
})
export class RegistersComponent implements OnInit {
	headers = ["name", "hex", "value"];
	register: Register[];
  constructor(private parserService: ParserService, private registerService: RegisterService) { }

  ngOnInit() {
  	this.register = this.registerService.getRegisters();
  	// this.registerService.setValueByRegister('RAX', 0)
  	// console.log(this.registerService.getValueByRegister('RAX'))
  }
}
