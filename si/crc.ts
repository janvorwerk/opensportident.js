/**
 * Translation to TypeScript by Jan Vorwerk
 */
/**
 * Released by SPORTident under the CC BY 3.0 license.
 * 
 * This work is licensed under the Creative Commons Attribution 3.0 Unported License.
 * To view a copy of this license, visit http://creativecommons.org/licenses/by/3.0/
 * or send a letter to Creative Commons, 444 Castro Street, Suite 900,
 * Mountain View, California, 94041, USA.
 */
const POLY = 0x8005;
const BITF = 0x8000;

export function crc(buffer: Uint8Array): number {
    let count = buffer.length;
    if (count < 2) {
        return 0;
    }
    let tmp: number;
    let ptr = 0;
    tmp = (buffer[ptr++] << 8 | (buffer[ptr++] & 0xFF));

    if (count > 2) {
        for (let i = Math.trunc(count / 2); i > 0; i--) // only even counts !!! and more
        // than 4
        {
            let val: number;
            if (i > 1) {
                val = (buffer[ptr++] << 8 | (buffer[ptr++] & 0xFF));
            } else {
                if (count % 2 == 1) {
                    val = buffer[count - 1] << 8;
                } else {
                    val = 0; // last value with 0 // last 16 bit value
                }
            }

            for (let j = 0; j < 16; j++) {
                if ((tmp & BITF) != 0) {
                    tmp <<= 1;

                    if ((val & BITF) != 0) {
                        tmp++; // rotate carry
                    }
                    tmp ^= POLY;
                } else {
                    tmp <<= 1;

                    if ((val & BITF) != 0) {
                        tmp++; // rotate carry
                    }
                }
                val <<= 1;
            }
        }
    }
    return (tmp & 0xFFFF);
}
