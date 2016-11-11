// Type definitions for serialport are wrong in DefinitelyTyped:
// - missing 'error' param in the open callback
// - isOpen is an attribute starting with 5.x...
// - missing PortOptions type

declare module 'serialport' {

    class SerialPort {
        constructor(path: string, options?: SerialPort.PortOptions, callback?: (err?: string) => void)
        isOpen(): boolean;
        on(event: string, callback?: (data?: any) => void): void;
        open(callback?: (err?: string) => void): void;
        write(buffer: any, callback?: (err: string, bytesWritten: number) => void): void
        pause(): void;
        resume(): void;
        disconnected(err: Error): void;
        close(callback?: (err: any) => void): void;
        flush(callback?: (err: any) => void): void;
        set(options: SerialPort.SetOptions, callback: () => void): void;
        drain(callback?: (err: any) => void): void;
        update(options: SerialPort.UpdateOptions, callback?: () => void): void;
        static list(callback: (err: string, ports: SerialPort.PortConfig[]) => void): void;
        static parsers: {
            readline: (delimiter: string) => void,
            raw: (emitter: any, buffer: string) => void
        };
    }
    namespace SerialPort {
        interface PortOptions {
            baudRate?: number;
            autoOpen?: boolean;
            parity?: string;
            xon?: boolean;
            xoff?: boolean;
            xany?: boolean;
            rtscts?: boolean;
            hupcl?: boolean;
            dataBits?: number;
            stopBits?: number;
            bufferSize?: number;
            lock?: boolean;
            parser?: any;
            platformOptions?: any;
        }
        interface Flags {
            brk?: boolean;
            cts?: boolean;
            dtr?: boolean;
            dts?: boolean;
            rts?: boolean;
        }
        interface PortConfig {
            comName: string;
            manufacturer: string;
            serialNumber: string;
            pnpId: string;
            locationId: string;
            vendorId: string;
            productId: string;
        }

        interface SetOptions {
            brk?: boolean;
            cts?: boolean;
            dsr?: boolean;
            dtr?: boolean;
            rts?: boolean;
        }

        interface UpdateOptions {
            baudRate?: number;
        }
    }
    export = SerialPort;
}
