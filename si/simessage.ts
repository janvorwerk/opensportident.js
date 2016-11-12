/// <reference path="./serialport.d.ts" />
import * as SerialPort from 'serialport';import { STX, ETX, SPORT_IDENT_VENDOR_ID } from './codes';
import { compute_crc } from './crc';
import { SiPortId } from '../opensportident';

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

export function decodeWireMessage(data: Uint8Array): SiMessage | string {
    if (data[0] !== STX) {
        return 'Missing STX';
    }
    if (data[data.length - 1] !== ETX) {
        return 'Missing ETX';
    }
    const paramsLength = data[2];
    if (paramsLength !== data.length - BASE_MESSAGE_LENGTH) {
        return 'Wrong length';
    }
    const expectedCrc = compute_crc(data.subarray(1, data.length - 3));
    const receivedCrc = data[data.length - 3] << 8 | data[data.length - 2];
    if (expectedCrc !== receivedCrc) {
        return 'Wrong CRC';
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
