/// <reference path="serialport.d.ts" />
import * as SerialPort from 'serialport';

import { MSG_BEEP } from './si/codes';

process.on('exit', () => {
    console.log('Exiting');
});

const SPORT_IDENT_VENDOR_ID = "0x10c4";

SerialPort.list((err, ports) => {
    ports.forEach(conf => {
        if (conf.vendorId === SPORT_IDENT_VENDOR_ID) {
            console.log(`${conf.comName} => ${conf.serialNumber}`);
            runOn(conf.comName);
        }
    })
});

function onSerialDataDebug(data: Uint8Array): void {
    console.log(`Receiving Uint8Array[${data.length}]: ${data.toLocaleString()}`);
}
function runOn(portName: string): void {
    const serialPort = new SerialPort("/dev/ttyUSB0", {
        baudRate: 38400,
        autoOpen: false
    });
    serialPort.on('data', onSerialDataDebug);
    serialPort.on('open', () => {
        console.log(`Open status: ${serialPort.isOpen()}`);
        serialPort.write(MSG_BEEP);
    });
    serialPort.on('error', (err: string) => {
        console.error(`Could not open serial port ${portName}: ${err}`)
    });
    serialPort.open();
}