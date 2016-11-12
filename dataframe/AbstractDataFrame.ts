/**
 * Copyright (c) 2013 Simon Denier
 */
import * as moment from 'moment';

import { SiDataFrame } from './SiDataFrame';
import { SiPunch, NO_TIME, SiReadout } from '../opensportident';
export abstract class AbstractDataFrame implements SiDataFrame {

	protected siNumber: string;

	protected checkTime: number;

	protected startTime: number;

	protected finishTime: number;

	protected punches: SiPunch[];

	abstract startingAt(zerohour: number): SiDataFrame;
	abstract getSiSeries(): string;

	public getSiNumber(): string {
		return this.siNumber;
	}

	public getStartTime(): number {
		return this.startTime;
	}

	public getFinishTime(): number {
		return this.finishTime;
	}

	public getCheckTime(): number {
		return this.checkTime;
	}

	public getPunches(): SiPunch[] {
		return this.punches;
	}

	public extract(): SiReadout {
		const ret = new SiReadout();
		ret.siCardSeries = this.getSiSeries();
		ret.siCardNumber = this.getSiNumber();
		ret.checkTimestampMs = this.getCheckTime();
		ret.startTimestampMs = this.getStartTime();
		ret.finishTimestampMs = this.getFinishTime();
		ret.punches = this.punches;
		return ret;
	}
}
