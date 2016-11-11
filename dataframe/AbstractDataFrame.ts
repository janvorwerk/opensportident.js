/**
 * Copyright (c) 2013 Simon Denier
 */
import * as moment from 'moment';

import { SiDataFrame, NO_TIME } from './SiDataFrame';
import { SiPunch } from './SiPunch';
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

	public getNbPunches(): number {
		return this.punches.length;
	}

	public getPunches(): SiPunch[] {
		return this.punches;
	}

	public formatTime(timestamp: number): string {
		if (timestamp === NO_TIME) {
			return "no time";
		} else {
			return moment.utc(timestamp).format('ddd HH:mm:ss');
		}
	}

	public debugString(): string {
		const start = this.formatTime(this.getStartTime());
		const finish = this.formatTime(this.getFinishTime());
		const check = this.formatTime(this.getCheckTime());
		const count = this.getPunches().length;
		const indenting = '.'.repeat(this.getSiSeries().length);
		let ret = `${this.getSiSeries()}: ${this.getSiNumber()} check(${check}) start(${start}) finish(${finish})\n ${indenting} ${count} punches:`;
		for (let i = 0; i < count; i++) {
			const punches = this.getPunches();
			ret += ` ${i+1}:${punches[i].code}(${this.formatTime(punches[i].timestamp)})`;
		}
		return ret;
	}
}