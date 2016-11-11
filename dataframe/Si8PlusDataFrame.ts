import { Si6PlusAbstractDataFrame } from './Si6PlusAbstractDataFrame';
import { SiMessage } from '../si/codes';
import { SiPunch } from './SiPunch';
/**
 * Copyright (c) 2013 Simon Denier
 */
const PAGE_SIZE = 4;
const SINUMBER_PAGE = 6 * PAGE_SIZE;
const NB_PUNCHES_INDEX = 5 * PAGE_SIZE + 2;

interface SiPlusSeries {
	ident: string;
	punchesPageIndex: number;
}
const SERIES = {
	SI8_SERIES: { ident: "SiCard 8", punchesPageIndex: 34 },
	SI9_SERIES: { ident: "SiCard 9", punchesPageIndex: 14 },
	SI10PLUS_SERIES: { ident: "SiCard 10/11/SIAC", punchesPageIndex: 32 },
	PCARD_SERIES: { ident: "pCard", punchesPageIndex: 44 },
	UNKNOWN_SERIES: { ident: "Unknown", punchesPageIndex: 0 }
}
export class Si8PlusDataFrame extends Si6PlusAbstractDataFrame {
	private siSeries: SiPlusSeries;

	public constructor(dataMessages: SiMessage[]) {
		super(dataMessages);
		this.siSeries = this.extractSiSeries();
	}

	protected extractSiSeries(): SiPlusSeries {
		switch (this.byteAt(SINUMBER_PAGE) & 15) {
			case 2:
				return SERIES.SI8_SERIES;
			case 1:
				return SERIES.SI9_SERIES;
			case 4:
				return SERIES.PCARD_SERIES;
			case 15:
				return SERIES.SI10PLUS_SERIES;
			default:
				return SERIES.UNKNOWN_SERIES;
		}
	}

	protected siNumberIndex(): number {
		return SINUMBER_PAGE + 1;
	}

	protected startTimeIndex(): number {
		return 3 * PAGE_SIZE;
	}

	protected finishTimeIndex(): number {
		return 4 * PAGE_SIZE;
	}

	protected checkTimeIndex(): number {
		return 2 * PAGE_SIZE;
	}

	protected nbPunchesIndex(): number {
		return NB_PUNCHES_INDEX;
	}

	protected extractPunches(startTime: number): SiPunch[] {
		let punches: SiPunch[] = new Array(this.rawNbPunches());
		let punchesStart = this.siSeries.punchesPageIndex;
		let refTime = startTime;
		for (let i = 0; i < punches.length; i++) {
			let punchIndex = (punchesStart + i) * PAGE_SIZE;
			let punchTime = this.advanceTimePast(this.extractFullTime(punchIndex), refTime);
			punches[i] = { code: this.extractCode(punchIndex), timestamp: punchTime };
			refTime = this.newRefTime(refTime, punchTime);
		}
		return punches;
	}

	public getSiSeries(): string {
		return this.siSeries.ident;
	}
}
