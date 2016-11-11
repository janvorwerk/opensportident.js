/// <reference path="../serialport.d.ts" />
import * as SerialPort from 'serialport';
import * as moment from 'moment';

import {
    SiMessage, buildWireMessage, decodeWireMessage, BEEP,
    MSG_STARTUP_SEQUENCE, NAK,
    SET_MASTER_MODE, SI_CARD_8_PLUS_DETECTED, GET_SI_CARD_8_PLUS_BN,
    SI_CARD_5_DETECTED, GET_SI_CARD_5
} from './codes';
import { Si8PlusDataFrame } from '../dataframe/Si8PlusDataFrame';
import { Si5DataFrame } from '../dataframe/Si5DataFrame';

export class SportIdentPortReader {
    private timeZero: number;
    private port: SerialPort;
    private onReceivedOpcode: Map<number, (WireMessage) => void> = new Map();

    private temp: SiMessage[];

    constructor(portName: string, timeZero?: number) {
        this.timeZero = timeZero ? timeZero : moment().startOf('day').valueOf();
        this.port = new SerialPort(portName, {
            baudRate: 38400,
            autoOpen: false
        });
        this.port.on('data', data => this.onDataReceived(data));
        this.port.on('open', () => this.runStartupSequence());
        this.onReceivedOpcode[SET_MASTER_MODE] = m => this.sendBeep(m);
        this.onReceivedOpcode[SI_CARD_8_PLUS_DETECTED] = m => this.onSiCard8PlusDetected(m);
        this.onReceivedOpcode[GET_SI_CARD_8_PLUS_BN] = m => this.onSiCard8PlusReadout(m);

        this.onReceivedOpcode[SI_CARD_5_DETECTED] = m => this.onSiCard5Detected(m);
        this.onReceivedOpcode[GET_SI_CARD_5] = m => this.onSiCard5Readout(m);
    }

    public open() {
        this.port.open();
    }

    private runStartupSequence(): void {
        this.send(MSG_STARTUP_SEQUENCE);
    }

    private onSiCard8PlusDetected(received?: SiMessage) {
        console.log(`... SiCard8+ detected`);
        this.send(buildWireMessage(GET_SI_CARD_8_PLUS_BN, 0)); // block number 0
    }

    private onSiCard8PlusReadout(received?: SiMessage) {
        const blockNumber = received.params[2];
        //console.log(`SiCard8+ payload BN=${blockNumber}: ${received.payload.byteLength} bytes`);
        if (blockNumber === 0) {
            this.temp = [received];
            this.send(buildWireMessage(GET_SI_CARD_8_PLUS_BN, 1)); // block number 1
        }
        else {
            let msg = [...this.temp, received];
            let frame = new Si8PlusDataFrame(msg).startingAt(this.timeZero);
            console.log(frame.debugString());
        }
    }

    private onSiCard5Detected(received?: SiMessage) {
        console.log(`... SiCard5 detected`);
        this.send(buildWireMessage(GET_SI_CARD_5));
    }

    private onSiCard5Readout(received?: SiMessage) {
        let frame = new Si5DataFrame(received).startingAt(this.timeZero);
        console.log(frame.debugString());
    }
    private sendBeep(received?: SiMessage) {
        const msg = buildWireMessage(BEEP, 0);
        this.send(msg);
    }
    private done(received?: SiMessage): void {
        //console.log('Done');
    }
    private send(data: Uint8Array): void {
        //console.log(` => ${data.toLocaleString()}`);
        this.port.write(data);
    }
    private onDataReceived(data: Uint8Array): void {
        if (data[0] === NAK) {
            console.error('Received ERROR from SportIdent station');
        }
        else {
            let msg = decodeWireMessage(data);
            if (!msg) {
                console.error('Received ERROR from SportIdent station');
            }
            else {
                //console.log(` <= ${msg.debugString()}`);
                const next = this.onReceivedOpcode[msg.opcode];
                if (next) {
                    next(msg);
                }
                else {
                    console.log(`Ignored received opcode: ${msg.opcode}`);
                }
            }
        }
    }
}
