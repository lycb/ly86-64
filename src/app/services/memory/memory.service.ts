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
      this.error = false;
      this.memory[address] = value;
      return;
    } else {
      this.error = true;
    }
  }

  getByte(address: number): Long {
    if (address >= 0 && address < Constants.MEMSIZE) {
      this.error = false;
      return this.memory[address];
    }
    this.error = true;
  }

  getError(): boolean {
    return this.error;
  }

  getMemory(): Long[] {
    return this.memory;
  }

  reset(): void {
    for (let i = 0; i < this.memory.length; i++) {
      this.memory[i] = Long.ZERO;
    }
    this.error = false;
  }
}
