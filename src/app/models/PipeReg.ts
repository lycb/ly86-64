import { PipeRegField } from './PipeRegField'
import * as Constants from "../constants";

export class F {
	predPC: PipeRegField;

	constructor() {
		this.predPC = new PipeRegField(0);
	}

	getPredPC(): PipeRegField {
		return this.predPC;
	}
}

export class D {
	stat: PipeRegField;
	icode: PipeRegField;
	ifun: PipeRegField;
	rA: PipeRegField;
	rB: PipeRegField;
	valC: PipeRegField;
	valP: PipeRegField;

	constructor() {
		this.stat = new PipeRegField(Constants.SAOK);
		this.icode = new PipeRegField(Constants.NOP);
		this.ifun = new PipeRegField(Constants.FNONE);
		this.rA = new PipeRegField(Constants.RNONE);
		this.rB = new PipeRegField(Constants.RNONE);
		this.valC = new PipeRegField(0);
		this.valP = new PipeRegField(0);
	}

	getstat(): PipeRegField {
		return this.stat;
	}

	geticode(): PipeRegField {
		return this.icode;
	}

	getifun(): PipeRegField {
		return this.ifun;
	}

	getrA(): PipeRegField {
		return this.rA;
	}

	getrB(): PipeRegField {
		return this.rB;
	}

	getvalC(): PipeRegField {
		return this.valC;
	}

	getvalP(): PipeRegField {
		return this.valP;
	}
}

export class E {
	stat: PipeRegField;
	icode: PipeRegField;
	ifun: PipeRegField;
	valC: PipeRegField;
	valA: PipeRegField;
	valB: PipeRegField;
	dstE: PipeRegField;
	dstM: PipeRegField;
	srcA: PipeRegField;
	srcB: PipeRegField;

	constructor() {
		this.stat = new PipeRegField(Constants.SAOK);
		this.icode = new PipeRegField(Constants.NOP);
		this.ifun = new PipeRegField(Constants.FNONE);
		this.valC = new PipeRegField(0);
		this.valA = new PipeRegField(0);
		this.valB = new PipeRegField(0);
		this.dstE = new PipeRegField(Constants.RNONE);
		this.dstM = new PipeRegField(Constants.RNONE);
		this.srcA = new PipeRegField(0);
		this.srcB = new PipeRegField(0);
	}

	getstat(): PipeRegField {
		return this.stat;
	}

	geticode(): PipeRegField {
		return this.icode;
	}

	getifun(): PipeRegField {
		return this.ifun;
	}

	getvalC(): PipeRegField {
		return this.valC;
	}

	getvalA(): PipeRegField {
		return this.valA;
	}

	getvalB(): PipeRegField {
		return this.valB;
	}

	getdstE(): PipeRegField {
		return this.dstE;
	}

	getdstM(): PipeRegField {
		return this.dstM;
	}

	getsrcA(): PipeRegField {
		return this.srcA;
	}

	getsrcB(): PipeRegField {
		return this.srcB;
	}
}

export class M {
	stat: PipeRegField;
	icode: PipeRegField;
	Cnd: PipeRegField;
	valE: PipeRegField;
	valA: PipeRegField;
	dstE: PipeRegField;
	dstM: PipeRegField;

	constructor() {
		this.stat = new PipeRegField(Constants.SAOK);
		this.icode = new PipeRegField(Constants.NOP);
		this.Cnd = new PipeRegField(0);
		this.valE = new PipeRegField(0);
		this.valA = new PipeRegField(0);
		this.dstE = new PipeRegField(Constants.RNONE);
		this.dstM = new PipeRegField(Constants.RNONE);
	}

	getstat(): PipeRegField {
		return this.stat;
	}

	geticode(): PipeRegField {
		return this.icode;
	}

	getCnd(): PipeRegField {
		return this.Cnd;
	}

	getvalE(): PipeRegField {
		return this.valE;
	}

	getvalA(): PipeRegField {
		return this.valA;
	}

	getdstE(): PipeRegField {
		return this.dstE;
	}

	getdstM(): PipeRegField {
		return this.dstM;
	}
}

export class W {
	stat: PipeRegField;
	icode: PipeRegField;
	valE: PipeRegField;
	valM: PipeRegField;
	dstE: PipeRegField;
	dstM: PipeRegField;

	constructor() {
		this.stat = new PipeRegField(Constants.SAOK);
		this.icode = new PipeRegField(Constants.NOP);
		this.valE = new PipeRegField(0);
		this.valM = new PipeRegField(0);
		this.dstE = new PipeRegField(Constants.RNONE);
		this.dstM = new PipeRegField(Constants.RNONE);
	}

	getstat(): PipeRegField {
		return this.stat;
	}

	geticode(): PipeRegField {
		return this.icode;
	}

	getvalE(): PipeRegField {
		return this.valE;
	}

	getvalM(): PipeRegField {
		return this.valM;
	}

	getdstE(): PipeRegField {
		return this.dstE;
	}

	getdstM(): PipeRegField {
		return this.dstM;
	}
}