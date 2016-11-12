/// <reference path="./serialport.d.ts" />
import * as SerialPort from 'serialport';
import * as moment from 'moment';
import { EventEmitter } from 'events';

import {
    BEEP,
    MSG_STARTUP_SEQUENCE, NAK,
    SET_MASTER_MODE, SI_CARD_8_PLUS_DETECTED, GET_SI_CARD_8_PLUS_BN,
    SI_CARD_5_DETECTED, GET_SI_CARD_5, SPORT_IDENT_VENDOR_ID
} from './codes';
import { Si8PlusDataFrame } from '../dataframe/Si8PlusDataFrame';
import { Si5DataFrame } from '../dataframe/Si5DataFrame';
import { SiMessage, buildWireMessage, decodeWireMessage } from './simessage';
import { SiPortId, SiEvent } from '../opensportident';
import { SI_CARD_REMOVED } from './codes';

export interface SiPortOptions {
    timeZero?: number;
    mute?: boolean;
}


export class SiPortReader {
    private port: SerialPort;
    private options: SiPortOptions;
    private eventEmitter: EventEmitter;
    private onReceivedOpcode: Map<number, (WireMessage) => void> = new Map();

    private temp: SiMessage[];

    constructor(portName: string, options?: SiPortOptions) {
        this.options = options || {};
        if (!this.options.timeZero) {
            this.options.timeZero = moment().startOf('day').valueOf();
        }
        this.eventEmitter = new EventEmitter();
        this.port = new SerialPort(portName, {
            baudRate: 38400,
            autoOpen: false
        });
        this.port.on('error', err => this.emit('error', err));
        this.port.on('close', () => this.onClose());
        this.port.on('data', data => this.onDataReceived(data));
        this.port.on('open', () => this.runStartupSequence());

        this.onReceivedOpcode[SET_MASTER_MODE] = m => this.ackConnection(m);
        this.onReceivedOpcode[BEEP] = () => {};
        this.onReceivedOpcode[SI_CARD_REMOVED] = () => {};

        this.onReceivedOpcode[SI_CARD_8_PLUS_DETECTED] = m => this.onSiCard8PlusDetected(m);
        this.onReceivedOpcode[GET_SI_CARD_8_PLUS_BN] = m => this.onSiCard8PlusReadout(m);

        this.onReceivedOpcode[SI_CARD_5_DETECTED] = m => this.onSiCard5Detected(m);
        this.onReceivedOpcode[GET_SI_CARD_5] = m => this.onSiCard5Readout(m);
    }

    public on(event: SiEvent, listener: Function): void {
        this.eventEmitter.on(event, listener);
    }
    public once(event: SiEvent, listener: Function): void {
        this.eventEmitter.once(event, listener);
    }
    public removeListener(event: SiEvent, listener: Function): void {
        this.eventEmitter.removeListener(event, listener);
    }

    public open() {
        this.port.open();
    }
    public close() {
        this.port.close();
    }

    private emit(event: SiEvent, ...params: any[]) {
        // send async to free the serial port as early as possible
        setImmediate(() => this.eventEmitter.emit(event, ...params));
    }
    private onClose() {
        this.port.flush();
        this.emit('close');
    }
    private runStartupSequence(): void {
        this.send(MSG_STARTUP_SEQUENCE);
    }

    private onSiCard8PlusDetected(received?: SiMessage) {
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
            this.beep(1);
            let msg = [...this.temp, received];
            let frame = new Si8PlusDataFrame(msg).startingAt(this.options.timeZero);
            this.emit('readout', frame.extract());
        }
    }

    private onSiCard5Detected(received?: SiMessage) {
        this.send(buildWireMessage(GET_SI_CARD_5));
    }

    private onSiCard5Readout(received?: SiMessage) {
        this.beep(1);
        let frame = new Si5DataFrame(received).startingAt(this.options.timeZero);
        this.emit('readout', frame.extract());
    }

    private beep(count: number) {
        if (count > 0 && !this.options.mute) {
            const msg = buildWireMessage(BEEP, count);
            this.send(msg);
        }
    }

    private ackConnection(received?: SiMessage) {
        this.beep(2);
        this.emit('open');
    }

    private send(data: Uint8Array): void {
        this.port.write(data);
    }
    private onDataReceived(data: Uint8Array): void {
        if (data[0] === NAK) {
            this.emit('error', 'Received ERROR (NAK) from SPORTident station');
        }
        else {
            let msg = decodeWireMessage(data);
            if (msg instanceof SiMessage) {
                const next = this.onReceivedOpcode[msg.opcode];
                if (next) {
                    next(msg);
                }
                else {
                    this.emit('warning', `Ignored received opcode: ${msg.opcode}`);
                }
            }
            else {
                this.emit('error', msg);
            }
        }
    }
}


export function listSiPorts(cb: (err:string, ports:SiPortId[]) => void): void {
    SerialPort.list((err, ports) => {
        if (err) cb(err, null)
        let p = ports.filter(conf => conf.vendorId === SPORT_IDENT_VENDOR_ID);
        cb(null, p);
    })
}