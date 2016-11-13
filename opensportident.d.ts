export declare const NO_TIME: number;
export interface SiPunch {
    controlCode: number;
    timestampMs: number;
}
export declare class SiReadout {
    siCardSeries: string;
    siCardNumber: string;
    checkTimestampMs: number;
    startTimestampMs: number;
    finishTimestampMs: number;
    punches: SiPunch[];
    toDebugString(): string;
}
export interface SiPortId {
    comName: string;
    serialNumber: string;
}
export declare type SiEvent = 'open' | 'close' | 'readout' | 'error' | 'warning';
export interface SiPortOptions {
    timeZero?: number;
    mute?: boolean;
    debug?: boolean;
}
export declare class SiPortReader {
    constructor(portName: string, options?: SiPortOptions);
    on(event: SiEvent, listener: Function): void;
    once(event: SiEvent, listener: Function): void;
    removeListener(event: SiEvent, listener: Function): void;
    open(): void;
    close(): void;
}
export declare function listSiPorts(cb: (err: string, ports: SiPortId[]) => void): void;
