export class PipeRegField {
	state: Long;
	input: Long;
	constructor(state: Long) {
		this.state = state;
		this.input = Long.ZERO;
	}

	setInput(input: Long): void {
		this.input = input;
	}

	getOutput(): Long {
		return this.state;
	}

	normal(): void {
		this.state = this.input;
	}

	stall(): void {
		// do nothing
	}

	bubble(state: Long): void {
		this.state = state;
	}
}