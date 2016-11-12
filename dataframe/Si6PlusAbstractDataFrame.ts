import { SiAbstractDataFrame, ONE_DAY, NO_SI_TIME, TWELVE_HOURS } from './SiAbstractDataFrame';
import { SiMessage } from '../si/simessage';
import { SiDataFrame } from './SiDataFrame';
import { SiPunch } from '../opensportident';
/**
 * Copyright (c) 2013 Simon Denier
 */
export abstract class Si6PlusAbstractDataFrame extends SiAbstractDataFrame {

	public constructor(dataMessages: SiMessage[]) {
		super();
		this.dataFrame = this.extractDataFrame(dataMessages);
		this.siNumber = this.extractSiNumber();
	}

	protected extractDataFrame(dataMessages: SiMessage[]): Uint8Array {
		const totalSize = 128 * dataMessages.length;
		const ret = new Uint8Array(totalSize);
		for (let i = 0; i < dataMessages.length; i++) {
			ret.set(dataMessages[i].payload.subarray(3), i * 128);
		}
		return ret;
	}
	protected extractSiNumber(): string {
		return `${this.block3At(this.siNumberIndex())}`;
	}

	public startingAt(zerohour: number): SiDataFrame {
		this.startTime = this.advanceTimePast(this.extractStartTime(), zerohour);
		this.checkTime = this.advanceTimePast(this.extractCheckTime(), zerohour);
		let refTime = this.newRefTime(zerohour, this.startTime);
		this.punches = this.extractPunches(refTime);
		if (this.punches.length > 0) {
			let lastPunch = this.punches[this.punches.length - 1];
			refTime = this.newRefTime(refTime, lastPunch.timestampMs);
		}
		this.finishTime = this.advanceTimePast(this.extractFinishTime(), refTime);
		return this;
	}

	public advanceTimePast(timestamp: number, refTime: number): number {
		return super.advanceTimePast(timestamp, refTime, ONE_DAY);
	}


	protected extractStartTime(): number {
		return this.extractFullTime(this.startTimeIndex());
	}

	protected extractFinishTime(): number {
		return this.extractFullTime(this.finishTimeIndex());
	}

	protected extractCheckTime(): number {
		return this.extractFullTime(this.checkTimeIndex());
	}

	protected rawNbPunches(): number {
		return this.byteAt(this.nbPunchesIndex());
	}

	protected extractFullTime(pageStart: number): number {
		//		int tdByte = byteAt(pageStart);
		//		int weekCounter = (tdByte & 48) >> 4;
		//		int numDay = (tdByte & 14) >> 1;
		let pmFlag = this.byteAt(pageStart) & 1;
		return this.computeFullTime(pmFlag, this.timestampAt(pageStart + 2));
	}

	public computeFullTime(pmFlag: number, twelveHoursTime: number): number {
		if (twelveHoursTime === NO_SI_TIME) {
			return NO_SI_TIME;
		}
		return pmFlag * TWELVE_HOURS + twelveHoursTime;
	}

	protected extractCode(punchIndex: number): number {
		let codeHigh = (this.byteAt(punchIndex) & 192) << 2;
		let code = codeHigh + this.byteAt(punchIndex + 1);
		return code;
	}

	protected abstract siNumberIndex(): number;

	protected abstract startTimeIndex(): number;

	protected abstract finishTimeIndex(): number;

	protected abstract checkTimeIndex(): number;

	protected abstract nbPunchesIndex(): number;

	protected abstract extractPunches(startTime: number): SiPunch[];
}