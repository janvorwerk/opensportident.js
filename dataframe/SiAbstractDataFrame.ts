import { AbstractDataFrame } from './AbstractDataFrame';
import { NO_TIME } from '../opensportident';
/**
 * Copyright (c) 2013 Simon Denier
 */
export const NO_SI_TIME = 1000 * 0xEEEE;
export const TWELVE_HOURS = 1000 * 12 * 3600;
export const ONE_DAY = 2 * TWELVE_HOURS;
export abstract class SiAbstractDataFrame extends AbstractDataFrame {
	protected dataFrame: Uint8Array;

	protected byteAt(i: number): number {
		return this.dataFrame[i];
	}

	protected wordAt(i: number): number {
		return this.dataFrame[i] << 8 | this.dataFrame[i + 1];
	}

	protected block3At(i: number): number {
		return this.dataFrame[i] << 16 | this.wordAt(i + 1);
	}

	protected timestampAt(i: number): number {
		return 1000 * this.wordAt(i);
	}

	public advanceTimePast(timestamp: number, refTime: number, stepTime: number): number {
		if (timestamp === NO_SI_TIME) {
			return NO_TIME;
		}
		if (refTime === NO_TIME) {
			return timestamp;
		}
		let newTimestamp = timestamp;
		// advance time until it is at least less than one hour before refTime
		// accomodates for drifting clocks or even controls with different daylight savings mode
		let baseTime = refTime - 3600000;
		while (newTimestamp < baseTime) {
			newTimestamp += stepTime;
		}
		return newTimestamp;
	}

	public newRefTime(refTime: number, punchTime: number): number {
		return punchTime != NO_TIME ? punchTime : refTime;
	}
}
