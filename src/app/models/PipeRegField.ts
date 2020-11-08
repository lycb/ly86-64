export class PipeRegField {
	state: number;
	input: number;
	constructor(state: number) {
		this.state = state;
		this.input = 0;
	}

	setInput(input: number): void {
		this.input = input;
	}

	getOutput(): number {
		return this.state;
	}

	normal(): void {
		this.state = this.input;
	}

	stall(): void {
		// do nothing
	}

	bubble(state: number): void {
		this.state = state;
	}
}