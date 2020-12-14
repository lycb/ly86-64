class Memory {
	private instance: number[];
	private memSize = 0x1000;

	constructor() {
		this.instance = new Array<number>(this.memSize);
	}

	putByte(value: number, address: number): void {
		if (address >= 0 && address < this.memSize) {
	       this.instance[address] = value;
	       return;
   		} else {
   			alert('error in putByte for address: ' + address);
   		}
	}

	getByte(address: number): number {
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

	function createInstance() {
		var object = new Memory(); 
		return object;
	}

	return {
		getInstance: function() {
			if (!instance) {
				instance = createInstance();
			}
			return instance;
		}
	}
})();