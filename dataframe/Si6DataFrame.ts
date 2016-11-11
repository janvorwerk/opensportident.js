import { Si6PlusAbstractDataFrame } from './Si6PlusAbstractDataFrame';
import { SiMessage } from '../si/codes';
import { SiPunch } from './SiPunch';
/**
 * Copyright (c) 2013 Simon Denier
 */
const PAGE_SIZE = 16;
const DOUBLE_WORD = 4;
const NB_PUNCHES_INDEX = 1 * PAGE_SIZE + 2;

export class Si6DataFrame extends Si6PlusAbstractDataFrame {

	public constructor(dataMessages: SiMessage[]) {
		super(dataMessages);
	}

	protected siNumberIndex(): number {
		return 2 * DOUBLE_WORD + 3;
	}

	protected startTimeIndex(): number {
		return 1 * PAGE_SIZE + 2 * DOUBLE_WORD;
	}

	protected finishTimeIndex(): number {
		return 1 * PAGE_SIZE + 1 * DOUBLE_WORD;
	}

	protected checkTimeIndex(): number {
		return 1 * PAGE_SIZE + 3 * DOUBLE_WORD;
	}

	protected nbPunchesIndex(): number {
		return NB_PUNCHES_INDEX;
	}

	protected punchesStartIndex(): number {
		return 8 * PAGE_SIZE;
	}

	protected extractPunches(startTime: number): SiPunch[] {
		let punches: SiPunch[] = new Array(this.rawNbPunches());
		let punchesStart = this.punchesStartIndex();
		let refTime = startTime;
		for (let i = 0; i < punches.length; i++) {
			let punchIndex = punchesStart + (DOUBLE_WORD * i);
			let punchTime = this.advanceTimePast(this.extractFullTime(punchIndex), refTime);
			punches[i] = { code: this.extractCode(punchIndex), timestamp: punchTime };
			refTime = this.newRefTime(refTime, punchTime);
		}
		return punches;
	}

	public getSiSeries(): string {
		return "SiCard 6";
	}
}
