import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConditionCodesService {

  OF: boolean;
  SF: boolean;
  ZF: boolean;

  constructor() {
    this.OF = false;
    this.SF = false;
    this.ZF = false;
  }
  getOF(): number {
    return this.OF ? 1: 0;
  }

  getSF(): number {
    return this.SF ? 1: 0;
  }

  getZF(): number {
    return this.ZF ? 1: 0;
  }

  setOF(OF: boolean): void {
    this.OF = OF;
  }

  setSF(SF: boolean): void {
    this.SF = SF;
  }

  setZF(ZF: boolean): void {
    this.ZF = ZF;
  }
}
