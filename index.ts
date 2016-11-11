/// <reference path="serialport.d.ts" />
import * as SerialPort from 'serialport';

import { buildWireMessage, BEEP, MSG_STARTUP_SEQUENCE, NAK, decodeWireMessage, WireMessage, SET_MASTER_MODE } from './si/codes';

process.on('exit', () => {
    console.log('Exiting');
});

const SPORT_IDENT_VENDOR_ID = "0x10c4";

SerialPort.list((err, ports) => {
    ports.forEach(conf => {
        if (conf.vendorId === SPORT_IDENT_VENDOR_ID) {
            console.log(`${conf.comName} => ${conf.serialNumber}`);
            const siPort = new SportIdentPort(conf.comName);
            siPort.open();
        }
    })
});


class SportIdentPort {
    private port: SerialPort;

    private onReceivedOpcode: Map<number, (WireMessage) => void> = new Map();

    constructor(portName: string) {
        this.port = new SerialPort(portName, {
            baudRate: 38400,
            autoOpen: false
        });
        this.port.on('data', data => this.onDataReceived(data));
        this.port.on('open', () => this.runStartupSequence());
        this.onReceivedOpcode[SET_MASTER_MODE] = m => this.sendBeep(m);
        this.onReceivedOpcode[BEEP] = m => this.done(m);
    }
    private runStartupSequence(): void {
        this.send(MSG_STARTUP_SEQUENCE);
    }
    private sendBeep(received?: WireMessage) {
        const msg = buildWireMessage(BEEP, 1);
        this.send(msg);
    }
    private done(received?: WireMessage): void {
        console.log('Done');
    }
    private send(data: Uint8Array): void {
        console.log(` => ${data.toLocaleString()}`);
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
                console.log(` <= ${msg.debugString()}`);
                const next = this.onReceivedOpcode[msg.opcode];
                if (next) {
                    next(msg);
                }
            }
        }
    }

    open() {
        this.port.open();
    }
}
