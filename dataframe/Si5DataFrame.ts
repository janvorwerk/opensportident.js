/**
 * Copyright (c) 2013 Simon Denier
 */
import { SiAbstractDataFrame, TWELVE_HOURS } from './SiAbstractDataFrame';
import { SiMessage } from '../si/simessage';
import { SiDataFrame } from './SiDataFrame';
import { SiPunch, NO_TIME } from '../opensportident';

const SI5_TIMED_PUNCHES = 30;

export class Si5DataFrame extends SiAbstractDataFrame {

	public constructor(message: SiMessage) {
		super();
		this.dataFrame = this.extractDataFrame(message);
		this.siNumber = this.extractSiNumber();
	}

	protected extractDataFrame(message: SiMessage): Uint8Array {
		return message.payload.subarray(2);
	}
	protected extractSiNumber(): string {
		let siNumber = this.wordAt(0x04);
		let cns = this.byteAt(0x06);
		if (cns > 0x01) {
			siNumber = siNumber + cns * 100000;
		}
		return `${siNumber}`;
	}
	public startingAt(zerohour: number): SiDataFrame {
		this.startTime = this.advanceTimePast(this.rawStartTime(), zerohour);
		this.checkTime = this.advanceTimePast(this.rawCheckTime(), zerohour);
		let refTime = this.newRefTime(zerohour, this.startTime);
		this.punches = this.computeShiftedPunches(refTime);
		if (this.punches.length > 0) {
			let lastTimedPunch = this.punches[this.nbTimedPunches(this.punches) - 1];
			refTime = this.newRefTime(refTime, lastTimedPunch.timestampMs);
		}
		this.finishTime = this.advanceTimePast(this.rawFinishTime(), refTime);
		return this;
	}

	public advanceTimePast(timestamp: number, refTime: number): number {
		return super.advanceTimePast(timestamp, refTime, TWELVE_HOURS);
	}

	private computeShiftedPunches(startTime: number): SiPunch[] {
		let nbPunches = this.rawNbPunches();
		const punches: SiPunch[] = new Array(nbPunches);
		let nbTimedPunches = this.nbTimedPunches(punches);
		let refTime = startTime;
		for (let i = 0; i < nbTimedPunches; i++) {
			// shift each punch time after the previous
			let punchTime = this.advanceTimePast(this.getPunchTime(i), refTime);
			let punchCode = this.getPunchCode(i);
			punches[i] = { controlCode: punchCode, timestampMs: punchTime };
			refTime = this.newRefTime(refTime, punchTime);
		}
		for (let i = 0; i < nbPunches - SI5_TIMED_PUNCHES; i++) {
			punches[i + SI5_TIMED_PUNCHES] = { controlCode: this.getNoTimePunchCode(i), timestampMs: NO_TIME };
		}
		return punches;
	}

	private nbTimedPunches(punches: SiPunch[]): number {
		return Math.min(punches.length, SI5_TIMED_PUNCHES);
	}

	protected rawNbPunches(): number {
		return this.byteAt(0x17) - 1;
	}

	private rawStartTime(): number {
		return this.timestampAt(0x13);
	}

	private rawFinishTime(): number {
		return this.timestampAt(0x15);
	}

	private rawCheckTime(): number {
		return this.timestampAt(0x19);
	}

	/**
	 * The punch offset is computed according to the following table.
	 * The 128 bytes block is coded here, where the offset in the buffer
	 * is two digits: row<<8|column. For instance, RC in row=1, column=7
	 * is found at buffer index 0x17.
	 * NB: records are written starting at 1 here, while the code uses a
	 * zero based index.
	 * 		0	1	2	3	4	5	6	7	8	9	A	B	C	D	E	F
     *  0	x	CI6	CI5	CI4	CN1	CN0	CNS	0	WP	**	**	**	**	**	**	**
     *  1	SB1	SN1	SN0	ST1	ST0	FT1	FT0	RC	SB2	CT1	CT0	SW	CNS	CS	FB	LB
     *  2	31	1.1	1.2	1.3	2.1	2.2	2.3	3.1	3.2	3.3	4.1	4.2	4.3	5.1	5.2	5.3
     *  3	32	6.1	6.2	6.3	7.1	7.2	7.3	8.1	8.2	8.3	9.1	9.2	9.3	...........
	 *  ...... etc..... See developer manual
	 */
	protected punchOffset(i: number): number {
		return 0x21 + Math.trunc(i / 5) * 0x10 + (i % 5) * 0x03;
	}

	protected getPunchCode(i: number): number {
		return this.byteAt(this.punchOffset(i));
	}

	protected getNoTimePunchCode(i: number): number {
		return this.byteAt(0x20 + i * 0x10);
	}

	protected getPunchTime(i: number): number {
		return this.timestampAt(this.punchOffset(i) + 1);
	}

	public getSiSeries(): string {
		return "SiCard 5";
	}

}
