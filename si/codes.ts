export const SPORT_IDENT_VENDOR_ID = "0x10c4";

/*
 * Basic protocol instructions
 */
export const WAKEUP = 0xFF;
export const STX = 0x02;
export const ETX = 0x03;
export const ACK = 0x06;
export const NAK = 0x15;

/*
 * Command instructions
 */
export const GET_SYSTEM_VALUE = 0x83;
export const SET_MASTER_MODE = 0xF0;
export const DIRECT_MODE = 0x4d;
export const BEEP = 0xF9;

/*
 * Card detected/removed
 */
export const SI_CARD_5_DETECTED = 0xE5;
export const SI_CARD_6_PLUS_DETECTED = 0xE6;
export const SI_CARD_8_PLUS_DETECTED = 0xE8;
export const SI_CARD_REMOVED = 0xE7;

/*
 * Card Readout instructions
 */
export const GET_SI_CARD_5 = 0xB1;
export const GET_SI_CARD_6_BN = 0xE1;
export const GET_SI_CARD_8_PLUS_BN = 0xEF;

/*
 * SiCard special data
 */
export const SI3_NUMBER_INDEX = 5;
export const SI_CARD_10_PLUS_SERIES = 0x0F;

/**
 * This is not built dynamically because of the weird WAKEUP first token
 */
export const MSG_STARTUP_SEQUENCE = new Uint8Array([WAKEUP, STX, STX, SET_MASTER_MODE, 0x01, DIRECT_MODE, 0x6D, 0x0A, ETX]);
