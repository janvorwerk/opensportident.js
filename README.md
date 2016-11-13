# opensportident.js
Open SPORTident JavaScript library.

[SPORTident](https://www.sportident.com/) is a system to time your outdoor sport activities. 

This library can be used in NodeJS or in Electron. See 'serialport' NPM module for usage in Electron.

## Status
It is currently tested with SiCard5, SiCard9 and SiCard10.

Code for SiCard6 and SiCard6* is written but not tested yet! 

## Example

```typescript
import { SiPortReader, SiReadout, listSiPorts, SiPortId, SiPortDetectedMode } from 'opensportident';

listSiPorts((err, ports)  => {
    if (err) {
        console.error(err);
    }
    else {
        if (!ports.length) {
            console.error('No SPORTident device found');
        }
        ports.forEach((portId: SiPortId) => {
            console.log(`Opening ${portId.comName} => ${portId.serialNumber}...`);

            const siPort = new SiPortReader(portId.comName, {mute: false, debug: false});

            siPort.on('open', (mode:SiPortDetectedMode) => console.log(`Connected to ${portId.comName} ${JSON.stringify(mode)})`));
            siPort.on('close', () => console.log(`Closed ${portId.comName} => ${portId.serialNumber}`));
            siPort.on('error', err => console.error(`Error on ${portId.comName}: ${err}`));
            siPort.on('warning', warn => console.warn(`Warning on ${portId.comName}: ${warn}`));
            siPort.on('readout', (readout: SiReadout) => console.log(readout.toDebugString()));
            
            siPort.open();
        });
    }
});
```

## Outcome
```
Opening /dev/ttyUSB0 => Silicon_Labs_SPORTident_USB_to_UART_Bridge_Controller_186893...
Connected to /dev/ttyUSB0 {"siCard6Punches":192,"baudRate":38400})
SiCard 10/11/SIAC: 7420103 check(Sun 09:09:02) start(no time) finish(Sun 10:12:06)
    -  1:72 Sun 09:16:46
    -  2:73 Sun 09:22:52
    -  3:75 Sun 09:26:22
    -  4:58 Sun 09:33:49
    -  5:48 Sun 09:39:18
    -  6:63 Sun 09:42:00
    -  7:37 Sun 09:45:54
    -  8:38 Sun 09:46:53
    -  9:66 Sun 09:56:11
    - 10:67 Sun 09:57:21
    - 11:68 Sun 10:00:40
    - 12:69 Sun 10:03:44
    - 13:56 Sun 10:06:56
    - 14:57 Sun 10:10:25
    - 15:255 Sun 10:11:25
SiCard 9: 1420154 check(Sun 14:19:20) start(Sun 14:24:07) finish(Sun 15:21:39)
    -  1:191 Sun 14:32:31
    -  2:216 Sun 14:43:06
    -  3:219 Sun 14:44:57
    -  4:208 Sun 14:54:07
    -  5:210 Sun 15:00:22
    -  6:182 Sun 15:04:50
    -  7:209 Sun 15:07:46
    -  8:225 Sun 15:11:22
    -  9:193 Sun 15:20:21
    - 10:200 Sun 15:21:28
```

## Origins
The ./dataframe/ folder (the most complex part dealing with the binary data reading)
is a close translation of https://github.com/sdenier/GecoSI

## Documentation
```typescript
/**
 * When no time is available for a time data
 * For instance no start time.
 */
export declare const NO_TIME: number;
/**
 * The individual records of the read punches
 */
export interface SiPunch {
    controlCode: number;
    timestampMs: number;
}
/**
 * When an SiCard is read, here is the data received
 * along with the 'readout' event
 */
export declare class SiReadout {
    siCardSeries: string;
    siCardNumber: string;
    checkTimestampMs: number;
    startTimestampMs: number;
    finishTimestampMs: number;
    punches: SiPunch[];
    toDebugString(): string;
}
/**
 * The identification of a reader port 
 */
export interface SiPortId {
    /**
     * The OS serial identifier (eg COM9 on Windows or /dev/ttyUSB0 on Linux)
     */
    comName: string;
    /**
     * A unique identifier of the SI station.
     * 
     * This should be prefered for any user interaction (saving preferences...)
     * because on Linux any plugged station will take /dev/ttyUSB0, then /dev/ttyUSB1, ...
     * no matter of the real device (on Windows, a station that was associated to COM9
     * will always be bound to COM9)
    */
    serialNumber: string;
}
/**
 * The types of events that can be emitted by the SiPortReader
 */
export declare type SiEvent = 'open' | 'close' | 'readout' | 'error' | 'warning';
/**
 * The options to open a port
 */
export interface SiPortOptions {
    timeZero?: number; // if omitted, takes 'today' at 00:00
    mute?: boolean; // keeps your family happy when coding :)
    debug?: boolean; // shows all trafic on the serial port
}
/**
 * Shows the port configuration once the communication was established
 */
export interface SiPortDetectedMode {
    siCard6Punches: number;
    baudRate: number;
}
/**
 * This is a readout engine for an SI station
 */
export declare class SiPortReader {
    constructor(portName: string, options?: SiPortOptions);
    /**
     * Binds a listener function to all events of the givent type
     */
    on(event: SiEvent, listener: Function): void;
    /**
     * Binds a listener function to the *next* single event of the givent type
     */
    once(event: SiEvent, listener: Function): void;
    /**
     * Removes a listener that was added with 'on' or 'once'
     */
    removeListener(event: SiEvent, listener: Function): void;
    /**
     * Open the port
     */
    open(): void;
    /**
     * Close the port
     */
    close(): void;
}
/**
 * List all the SPORTident station found on the computer (whether they are
 * already open by another application or not).
 */
export declare function listSiPorts(cb: (err: string, ports: SiPortId[]) => void): void;
```