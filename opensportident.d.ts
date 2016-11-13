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
