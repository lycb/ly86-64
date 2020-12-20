import Long from 'long';
import { UtilsService } from "../services/utils/utils.service";

class Memory {
	private instance: Long[];
	private memSize = 0x1000;
	private error = false;

	constructor(private utilsService: UtilsService) {
		this.instance = new Array<Long>(this.memSize);
	}

	putLong(value: Long, address: number): void {
		if (address % 8 == 0 && address >= 0 && address < this.memSize - 7) {
			this.error = false;
			for (let i = 0; i < 8; i++) {
				this.instance[address + i] = this.utilsService.getByte(value, i);
			}
			return;
		}
		this.error = true;
	}

	getLong(address: number): Long {
		if (address % 8 == 0 && address >= 0 && address < this.memSize - 7) {
			this.error = false;
			let longArr = new Array<Long>(8);
			for (let i = 0; i < 8; i++) {
				longArr[i] = this.instance[address + i];
			}
			return this.utilsService.buildLong(longArr);
		}
		this.error = true;
	}

	getError(): boolean {
		return this.error;
	}

	putByte(value: Long, address: number): void {
		if (address >= 0 && address < this.memSize) {
			this.instance[address] = value;
			return;
		} else {
			alert('error in putByte for address: ' + address);
		}
	}

	getByte(address: number): Long {
		if (address >= 0 && address < this.memSize) {
			return this.instance[address];
		}
		alert('error in getByte for address: ' + address);
		return null;
	}

	print(): void {
		for (let i = 0; i < this.instance.length; i++) {
			console.log("address: " + i + ", " + this.instance[i]);
		}
	}
}

export var MemoryFunc = (function() {
	var instance;

	function createInstance(utilsService: UtilsService) {
		var object = new Memory(utilsService);
		return object;
	}

	return {
		getInstance: function(utilsService: UtilsService) {
			if (!instance) {
				instance = createInstance(utilsService);
			}
			return instance;
		}
	}
})();