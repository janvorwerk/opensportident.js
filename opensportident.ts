import * as moment from 'moment';
import { listSiPorts } from './si/siport';

export const NO_TIME = -1;

export interface SiPunch {
	controlCode: number;
	timestampMs: number;
}
export class SiReadout {
	siCardSeries: string;
	siCardNumber: string;
	checkTimestampMs: number;
	startTimestampMs: number;
	finishTimestampMs: number;
	punches: SiPunch[];

	debugString(): string {
		const start = this.formatTime(this.startTimestampMs);
		const finish = this.formatTime(this.finishTimestampMs);
		const check = this.formatTime(this.checkTimestampMs);
		const count = this.punches.length;
		const indenting = ' '.repeat(this.siCardSeries.length + 1);
		let ret = `${this.siCardSeries}: ${this.siCardNumber} check(${check}) start(${start}) finish(${finish})`;
		for (let i = 0; i < count; i++) {
			ret += `\n${indenting} - ${i + 1}:${this.punches[i].controlCode} ${this.formatTime(this.punches[i].timestampMs)}`;
		}
		return ret;
	}

	private formatTime(timestamp: number): string {
		if (timestamp === NO_TIME) {
			return "no time";
		} else {
			return moment.utc(timestamp).format('ddd HH:mm:ss');
		}
	}
}

export interface SiPortId {
	comName: string;
	serialNumber: string;
}
export type SiEvent = 'open' | 'close' | 'readout' | 'error' | 'warning';
export { SiPortReader, listSiPorts } from './si/siport';
