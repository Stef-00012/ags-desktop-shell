export type CoreInfo = {
	idle: number;
	total: number;
	percentage: number;
};

export type CPUInfo = {
	[total: string]: CoreInfo;
	[coreNumber: number]: CoreInfo;
};

export type NetworkStat = {
	rx: number;
	tx: number;
	icon: string;
	interface: string;
	isWifi: boolean;
	isWired: boolean;
} & (
	| {
			isWifi: true;
			ssid: string;
			frequency: number;
			strength: number;
	  }
	| {
			isWifi: false;
	  }
);

export type MemoryStat = {
	memory: RAMStat;
	swap: SwapStat;
};

type RAMStat = {
	available: string;
	free: string;
	total: string;
	used: string;
	usage: number;
};

type SwapStat = {
	total: string;
	used: string;
	free: string;
	usage: number;
};

export type DiskStat = {
	device: string;
	totalSize: string;
	usedSize: string;
	availableSize: string;
	usagePercent: string;
	path: string;
};
