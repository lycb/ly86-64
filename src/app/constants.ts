export const REGISTERS = [
	'EAX',
	'ECX',
	'EDX',
	'EBX',
	'ESP',
	'EBP',
	'ESI',
	'EDI',
	'RNONE'
]

export const EAX = 0
export const ECX = 1
export const EDX = 2
export const EBX = 3
export const ESP = 4
export const EBP = 5
export const ESI = 6
export const EDI = 7
export const RNONE = 0xf;

export const INSTRUCTIONS = [
	'NOP', 
	'HALT', 
	'RRMOVL',
	'IRMOVL',
	'RMMOVL',
	'MRMOVL',
	'OPL',
	'JXX',
	'CALL',
	'RET',
	'PUSHL',
	'POPL',
]

export const NOP = 0
export const HALT = 1
export const RRMOVL = 2
export const IRMOVL = 3
export const RMMOVL = 4
export const MRMOVL = 5
export const OPL = 6
export const JXX = 7
export const CALL = 8
export const RET = 9
export const PUSHL = 10
export const POPL = 11

// OPL
export const ADD = 0
export const SUB = 1
export const AND = 2
export const XOR = 3
export const NONE = 4

// control logic
export const LOAD = 0
export const STALL = 1
export const BUBBLE = 2

// flags
export const ZF = 0
export const SF = 1
export const OF = 2


