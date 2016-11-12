import { SiPunch, SiReadout } from '../opensportident';

export interface SiDataFrame {
	startingAt(zerohour: number): SiDataFrame;
	getSiSeries(): string;

	getSiNumber(): string;

	getStartTime(): number;

	getFinishTime(): number;

	getCheckTime(): number;

	getPunches(): SiPunch[];

	extract(): SiReadout;
}