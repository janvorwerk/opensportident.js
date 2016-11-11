/// <reference path="serialport.d.ts" />
import * as SerialPort from 'serialport';
import { SPORT_IDENT_VENDOR_ID } from './si/codes';
import { SportIdentPortReader } from './si/portreader';

process.on('exit', () => {
    console.log('Exiting');
});


SerialPort.list((err, ports) => {
    ports.forEach(conf => {
        if (conf.vendorId === SPORT_IDENT_VENDOR_ID) {
            console.log(`${conf.comName} => ${conf.serialNumber}`);
            const siPort = new SportIdentPortReader(conf.comName);
            siPort.open();
        }
    })
});
