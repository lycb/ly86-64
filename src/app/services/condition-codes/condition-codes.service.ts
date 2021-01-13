import { Injectable } from '@angular/core';
import Long from 'long';

@Injectable({
  providedIn: 'root'
})
export class ConditionCodesService {

  OF: Long;
  SF: Long;
  ZF: Long;

  constructor() {
    this.OF = Long.ZERO;
    this.SF = Long.ZERO;
    this.ZF = Long.ZERO;
  }
  getOF(): Long {
    return this.OF;
  }

  getSF(): Long {
    return this.SF;
  }

  getZF(): Long {
    return this.ZF;
  }

  setOF(OF: Long): void {
    this.OF = OF;
  }

  setSF(SF: Long): void {
    this.SF = SF;
  }

  setZF(ZF: Long): void {
    this.ZF = ZF;
  }
}
