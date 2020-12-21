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
	'R14',
	'RNONE'
]

export const RAX = 0;
export const RCX = 1;
export const RDX = 2;
export const RBX = 3;
export const RSP = 4;
export const RBP = 5;
export const RSI = 6;
export const RDI = 7;
export const R8 = 8;
export const R9 = 9;
export const R10 = 10;
export const R11 = 11;
export const R12 = 12;
export const R13 = 13;
export const R14 = 14;
export const RNONE = 15;

export const REGSIZE = 15;

export const INSTRUCTIONS = [
	'HALT', 
	'NOP',
	'RRMOVL',
	'IRMOVL',
	'RMMOVL',
	'MRMOVL',
	'OPQ',
	'JXX',
	'CALL',
	'RET',
	'PUSHQ',
	'POPQ',
]

export const FNONE = 0
export const HALT = 0
export const NOP = 1
export const RRMOVQ = 2
export const CMOVXX = 2
export const IRMOVQ = 3
export const RMMOVQ = 4
export const MRMOVQ = 5
export const OPQ = 6
export const JXX = 7
export const CALL = 8
export const RET = 9
export const PUSHQ = 10
export const POPQ = 11

// OPERATIONS
export const ADD = 0
export const SUB = 1
export const AND = 2
export const XOR = 3

// MOVES
export const CMOVLE = 1
export const CMOVL = 2
export const CMOVE = 3
export const CMOVNE = 4
export const CMOVGE = 5
export const CMOVG = 6

export const UNCOND = 0
export const LESSEQ = 1
export const LESS = 2
export const EQUAL = 3
export const NOTEQUAL = 4
export const GREATEREQ = 5
export const GREATER = 6

// BRANCHES
export const JMP = 0
export const JLE = 1
export const JL = 2
export const JE = 3
export const JNE = 4
export const JGE = 5
export const JG = 6

// control logic
export const LOAD = 0
export const STALL = 1
export const BUBBLE = 2

// flags
export const ZF = 0
export const SF = 1
export const OF = 2

// status
export const SAOK = 1 // ok status
export const SHLT = 2 // if icode is halt
export const SADR = 3
export const SINS = 4 // invalid instruction


// number of bytes
export const VALC_BYTES = 8;
export const REG_BYTES = 2;
export const PC_INCREMENT = 1;

// sizes
export const MEMSIZE = 0x1000;