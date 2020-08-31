import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ParserService {

  constructor() { }

  parse(line: string) {
  	console.log(line);
  }
}
