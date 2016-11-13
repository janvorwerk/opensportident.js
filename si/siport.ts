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
import { SiPortId, SiEvent, SiPortDetectedMode } from '../opensportident';
import { SI_CARD_REMOVED, GET_SI_CARD_6_BN, SI_CARD_6_PLUS_DETECTED, GET_SYSTEM_VALUE, GET_SYSTEM_VALUE_CPC, MASK_CPC_EXTENDED_PROTOCOL, MASK_CPC_AUTOSEND, GET_SYSTEM_VALUE_CARDBLOCKS, SI_CARD_10_PLUS_SERIES, MASK_CPC_HANDSHAKE } from './codes';
import { SiDataFrame } from '../dataframe/SiDataFrame';
import { Si6DataFrame } from '../dataframe/Si6DataFrame';

export interface SiPortOptions {
    timeZero?: number;
    mute?: boolean;
}


export class SiPortReader {
    private port: SerialPort;
    private options: SiPortOptions;
    private eventEmitter: EventEmitter;
    private onReceivedOpcode: Map<number, (WireMessage) => void> = new Map();
    private si6CardBlocksCount: number;
    private baudRate: number;
    private temp: SiMessage[];
    /** only valid while reading SiCard8+ */
    private isSiCard10Plus: boolean;

    constructor(portName: string, options?: SiPortOptions) {
        this.options = options || {};
        if (!this.options.timeZero) {
            this.options.timeZero = moment().startOf('day').valueOf();
        }
        this.eventEmitter = new EventEmitter();
        this.baudRate = 38400; // TODO: add 4800 in case of failure
        this.port = new SerialPort(portName, {
            baudRate: this.baudRate,
            autoOpen: false
        });
        this.port.on('error', err => this.emit('error', err));
        this.port.on('close', () => this.emit('close'));
        this.port.on('data', data => this.onDataReceived(data));
        this.port.on('open', () => this.send(MSG_STARTUP_SEQUENCE));

        this.onReceivedOpcode[SET_MASTER_MODE] = m => this.readConfig();
        this.onReceivedOpcode[GET_SYSTEM_VALUE] = m => this.onConfig(m);

        this.onReceivedOpcode[BEEP] = () => { };
        this.onReceivedOpcode[SI_CARD_REMOVED] = () => { };

        this.onReceivedOpcode[SI_CARD_5_DETECTED] = () => this.send(buildWireMessage(GET_SI_CARD_5));
        this.onReceivedOpcode[GET_SI_CARD_5] = m => this.onSiCard5(m);

        this.onReceivedOpcode[SI_CARD_6_PLUS_DETECTED] = () => this.send(buildWireMessage(GET_SI_CARD_6_BN, 8)); // ask for all blocks
        this.onReceivedOpcode[GET_SI_CARD_6_BN] = m => this.onSiCard6(m);

        this.onReceivedOpcode[SI_CARD_8_PLUS_DETECTED] = (m) => this.onSiCard8PlusDetected(m);
        this.onReceivedOpcode[GET_SI_CARD_8_PLUS_BN] = m => this.onSiCard8Plus(m);
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

    private onSiCard8PlusDetected(received: SiMessage) {
        // SiCard8 and SiCard9 have 2 blocks and need to be read explicitly
        // Starting with SiCard10, you can send '8', which tells, send all the
        // blocks as in the SiCard6. I could not find the doc for this
        // discrimination byte but that's how Simon does it in GecoSI...
        const siCardDiscriminator = received.params[3];
        this.isSiCard10Plus = siCardDiscriminator === SI_CARD_10_PLUS_SERIES;
        if (this.isSiCard10Plus) {
            this.send(buildWireMessage(GET_SI_CARD_8_PLUS_BN, 8)); // ask for all 5 blocks;
        }
        else {
            this.send(buildWireMessage(GET_SI_CARD_8_PLUS_BN, 0)); // ask for block number 0;
        }
    }

    private onSiCard6(received: SiMessage) {
        this.handleChainedBlocks(received, this.si6CardBlocksCount, null, (msg) => new Si6DataFrame(msg));
    }

    private onSiCard8Plus(received: SiMessage) {
        if (this.isSiCard10Plus) {
            this.handleChainedBlocks(received, 5, null, (msg) => new Si8PlusDataFrame(msg));
        }
        else {
            this.handleChainedBlocks(received, 2, GET_SI_CARD_8_PLUS_BN, (msg) => new Si8PlusDataFrame(msg));
        }
    }

    private handleChainedBlocks(received: SiMessage, expectedCount: number, opcode: number | null, frameBuilder: (m: SiMessage[]) => SiDataFrame) {
        const blockNumber = received.params[2];
        if (blockNumber === 0) {
            this.temp = [];
        }
        // accumulate
        this.temp.push(received)

        if (this.temp.length < expectedCount) {
            if (opcode) {
                this.send(buildWireMessage(opcode, blockNumber + 1));
            }
        }
        else {
            this.beep(1);
            let frame = frameBuilder(this.temp).startingAt(this.options.timeZero);
            this.emit('readout', frame.extract());
        }
    }

    private onSiCard5(received: SiMessage) {
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

    private readConfig() {
        // first read the protocol config
        const msg = buildWireMessage(GET_SYSTEM_VALUE, GET_SYSTEM_VALUE_CPC);
        this.send(msg);
    }

    private onConfig(received: SiMessage) {
        const conf = received.params[2];
        if (conf === GET_SYSTEM_VALUE_CPC) {
            const cpc = received.params[3];
            if (!(cpc & MASK_CPC_EXTENDED_PROTOCOL)) {
                this.emit('error', 'Station should be setup in extended protocol');
            }
            if (cpc & MASK_CPC_AUTOSEND) {
                this.emit('error', 'Master station should not be setup in auto-send');
            }
            if (!(cpc & MASK_CPC_HANDSHAKE)) {
                this.emit('error', 'Station should be setup in handshake mode');
            }
            
            // then read the cardBlocks config
            const msg = buildWireMessage(GET_SYSTEM_VALUE, GET_SYSTEM_VALUE_CARDBLOCKS);
            this.send(msg);
        }
        else if (conf === GET_SYSTEM_VALUE_CARDBLOCKS) {
            let si6CardBlocks = received.params[3];
            if (si6CardBlocks === 0x0) {
                // For compatibility reasons CardBlocks = 0x00 is interpreted like CardBlocks = 0xC1 which addresses blocks 0,6,7
                this.si6CardBlocksCount = 0xc1;
            }
            this.si6CardBlocksCount = this.bitCount(si6CardBlocks);
            this.onStartupOk({ siCard6Punches: 24 * this.si6CardBlocksCount, baudRate: this.baudRate })
        }
    }

    private bitCount(value: number) {
        let count = 0;
        while (value > 0) {           // until all bits are zero
            if ((value & 1) == 1)     // check lower bit
                count++;
            value >>= 1;              // shift bits, removing lower bit
        }
        return count;
    }

    private onStartupOk(mode: SiPortDetectedMode) {
        this.beep(2);
        this.emit('open', mode);
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


export function listSiPorts(cb: (err: string, ports: SiPortId[]) => void): void {
    SerialPort.list((err, ports) => {
        if (err) cb(err, null)
        let p = ports.filter(conf => conf.vendorId === SPORT_IDENT_VENDOR_ID);
        cb(null, p);
    })
}