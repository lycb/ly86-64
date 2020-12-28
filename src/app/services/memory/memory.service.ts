import { Injectable } from '@angular/core';
import Long from 'long';
import { UtilsService } from "../utils/utils.service";
import * as Constants from "../../constants";

@Injectable({
  providedIn: 'root'
})
export class MemoryService {
  memory: Long[];
  error: boolean;

  constructor(private utilsService: UtilsService) {
    this.memory = [];
    this.error = false;

    for (let i = 0; i < Constants.MEMSIZE; i++) {
      this.memory.push(Long.ZERO);
    }
  }

  putLong(value: Long, address: number): void {
    if (address % 8 == 0 && address >= 0 && address < Constants.MEMSIZE - 7) {
      this.error = false;
      for (let i = 0; i < 8; i++) {
        this.memory[address + i] = this.utilsService.getByte(value, i);
      }
      return;
    }
    this.error = true;
  }

  getLong(address: number): Long {
    if (address % 8 == 0 && address >= 0 && address < Constants.MEMSIZE - 7) {
      this.error = false;
      let longArr = new Array<Long>(8);
      for (let i = 0; i < 8; i++) {
        longArr[i] = this.memory[address + i];
      }
      return this.utilsService.buildLong(longArr);
    }
    this.error = true;
  }

  putByte(value: Long, address: number): void {
    if (address >= 0 && address < Constants.MEMSIZE) {
      this.memory[address] = value;
      return;
    } else {
      alert('error in putByte for address: ' + address);
    }
  }

  getByte(address: number): Long {
    if (address >= 0 && address < Constants.MEMSIZE) {
      return this.memory[address];
    }
    alert('error in getByte for address: ' + address);
    return null;
  }

  getError(): boolean {
    return this.error;
  }

  getMemory(): Long[] {
    return this.memory;
  }
}
