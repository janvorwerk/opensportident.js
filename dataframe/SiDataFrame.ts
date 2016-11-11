import { SiPunch } from './SiPunch';

export const NO_TIME = -1;
export interface SiDataFrame {
	startingAt(zerohour: number): SiDataFrame;
	getSiSeries(): string;

	getNbPunches(): number;

	getSiNumber(): string;

	getStartTime(): number;

	getFinishTime(): number;

	getCheckTime(): number;

	getPunches(): SiPunch[];

	debugString(): string;
}