export const WAKEUP = 0xFF;
export const STX = 0x02;
export const ETX = 0x03;
export const ACK = 0x06;
export const NAK = 0x15;
export const BEEP = 0xF9;


export const MSG_BEEP = new Uint8Array([STX, BEEP, 0x01, 0x02, 0x14, 0x0A, ETX]);
