import { compute_crc } from './crc';

export const SPORT_IDENT_VENDOR_ID = "0x10c4";

/*
 * Basic protocol instructions
 */
const WAKEUP = 0xFF;
const STX = 0x02;
const ETX = 0x03;
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

export const MSG_STARTUP_SEQUENCE = new Uint8Array([WAKEUP, STX, STX, SET_MASTER_MODE, 0x01, DIRECT_MODE, 0x6D, 0x0A, ETX]);

const BASE_MESSAGE_LENGTH = 6; // STX, opcode, length, ..., crc1, crc0, ETX

export class SiMessage {
    opcode: number;
    params?: number[];
    payload: Uint8Array;

    debugString(): string {
        let ret = `{opcode: 0x${this.opcode.toString(16)}`;
        if (this.params) {
            ret += ', params: [';
            for (let i = 0; i < this.params.length; i++) {
                const prefix = i ? ', ' : '';
                ret += `${prefix}0x${this.params[i].toString(16)}(${this.params[i]})`;
            }
            ret += ']';
        }
        ret += '}';
        return ret;
    }
}

export function decodeWireMessage(data: Uint8Array): SiMessage | null {
    if (data[0] !== STX) {
        console.log('Missing STX');
        return null;
    }
    if (data[data.length - 1] !== ETX) {
        console.log('Missing ETX');
        return null;
    }
    const paramsLength = data[2];
    if (paramsLength !== data.length - BASE_MESSAGE_LENGTH) {
        console.log('Wrong length');
        return null;
    }
    const expectedCrc = compute_crc(data.subarray(1, data.length - 3));
    const receivedCrc = data[data.length - 3] << 8 | data[data.length - 2];
    if (expectedCrc !== receivedCrc) {
        console.log('Wrong CRC');
        return null;
    }
    const ret: SiMessage = new SiMessage();
    ret.opcode = data[1]
    if (paramsLength) {
        ret.params = [];
        for (let i = 0; i < paramsLength; i++) {
            ret.params[i] = data[3 + i];
        }
    }
    ret.payload = data.subarray(3, data.length - 3);
    return ret;
}


/**
 * Builds a wire message with the opcode and the (optional) params
 */
export function buildWireMessage(opcode: number, ...params: number[]): Uint8Array {
    let size = BASE_MESSAGE_LENGTH;
    if (params) {
        size += params.length;
    }
    const ret = new Uint8Array(size);
    ret[0] = STX;
    ret[1] = opcode;
    ret[2] = params.length;
    for (let i = 0; i < params.length; i++) {
        ret[3 + i] = params[i] & 0xff;
    }
    const c = compute_crc(ret.subarray(1, size - 3));
    const c1 = c >> 8 & 0xff;
    const c0 = c & 0xff;
    ret[size - 3] = c1;
    ret[size - 2] = c0;
    ret[size - 1] = ETX;
    return ret;
}

