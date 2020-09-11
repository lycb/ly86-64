export const REGISTERS = [
	'RAX',
	'RCX',
	'RDX',
	'RBX',
	'RSP',
	'RBP',
	'RSI',
	'RDI',
	'R8',
	'R9',
	'R10',
	'R11',
	'R12',
	'R13',
	'R14'
]

export const REGSIZE = 15;

export const INSTRUCTIONS = [
	'HALT', 
	'NOP',
	'RRMOVL',
	'IRMOVL',
	'RMMOVL',
	'MRMOVL',
	'OP',
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


