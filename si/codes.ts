import { crc } from './crc';
/*
 * Basic protocol instructions
 */
export const WAKEUP = 0xFF;
export const STX = 0x02;
export const ETX = 0x03;
export const ACK = 0x06;
export const NAK = 0x15;

/*
 * Command instructions
 */
export const GET_SYSTEM_VALUE = 0x83;
export const SET_MASTER_MODE = 0xF0;
export const DIRECT_MODE = 0x4d;
export const BEEP = 0xF9;

/*
 * Card detected/removed
 */
export const SI_CARD_5_DETECTED = 0xE5;
export const SI_CARD_6_PLUS_DETECTED = 0xE6;
export const SI_CARD_8_PLUS_DETECTED = 0xE8;
export const SI_CARD_REMOVED = 0xE7;

/*
 * Card Readout instructions
 */
export const GET_SI_CARD_5 = 0xB1;
export const GET_SI_CARD_6_BN = 0xE1;
export const GET_SI_CARD_8_PLUS_BN = 0xEF;

/*
 * SiCard special data
 */
export const SI3_NUMBER_INDEX = 5;
export const SI_CARD_10_PLUS_SERIES = 0x0F;



export const MSG_BEEP = new Uint8Array([STX, BEEP, 0x01, 0x02, 0x14, 0x0A, ETX]);



export function buildMessage(opcode: number, params?: number[]): Uint8Array {
    let tmp: number[] = [];
    tmp.push(opcode);
    if (params) {
        tmp.push(params.length);
        for (let i = 0; i < params.length; i++) {
            tmp.push(params[i] & 0xff);
        }
    }
    else {
        tmp.push(0x0);
    }
    
    const c = crc(new Uint8Array(tmp));
    const c1 = c >> 8 & 0xff;
    const c0 = c & 0xff;
    tmp.push(c1);
    tmp.push(c0);
    tmp.push(ETX);
    tmp = [STX, ...tmp];
    return new Uint8Array(tmp);
}

console.log(buildMessage(BEEP, [0x2]));
console.log(MSG_BEEP);
