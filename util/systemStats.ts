/*
	Modified version of:
	https://github.com/Mabi19/desktop-shell/blob/d70189b2355a4173a8ea6d5699f340fe73497945/utils/system-stats.ts
*/

import { defaultConfig } from "@/constants/config";
import type {
	CoreInfo,
	CPUInfo,
	DiskStat,
	MemoryStat,
	NetworkStat,
} from "@/types/systemStats";
import { config } from "@/util/config";
import { createState } from "ags";
import { readFileAsync } from "ags/file";
import { execAsync } from "ags/process";
import { interval } from "ags/time";
import Network from "gi://AstalNetwork";

export const [cpuUsage, setCpuUsage] = createState<CPUInfo>({
	total: {
		idle: 0,
		total: 0,
		percentage: 0,
	},
});

export const [memoryUsage, setMemoryUsage] = createState<MemoryStat>({
	memory: {
		available: "0B",
		total: "0B",
		free: "0B",
		used: "0B",
		usage: 0,
	},
	swap: {
		total: "0B",
		free: "0B",
		used: "0B",
		usage: 0,
	},
});

export const [networkUsage, setNetworkUsage] = createState<NetworkStat>({
	rx: 0,
	tx: 0,
	interface: "Unknown",
	isWifi: false,
	isWired: false,
	icon: "network-offline-symbolic",
});

export const [diskUsage, setDiskUsage] = createState<DiskStat>({
	device: "Unkonwn",
	totalSize: "0B",
	usedSize: "0B",
	availableSize: "0B",
	usagePercent: "0B",
	path: "0B",
});

const lastCpuInfo: CPUInfo = {};

function getCoreInfo(core: string, coreData: number[]): CoreInfo | null {
	const idle = coreData[3] + coreData[4];
	const total = coreData.reduce((subtotal, curr) => subtotal + curr, 0);

	const prevCoreData: CoreInfo | undefined = lastCpuInfo[core];

	if (prevCoreData) {
		const deltaIdle = idle - prevCoreData.idle;
		const deltaTotal = total - prevCoreData.total;

		return {
			idle: deltaIdle,
			total: deltaTotal,
			percentage: 100 * (1 - deltaIdle / deltaTotal),
		};
	}

	lastCpuInfo[core] = {
		idle,
		total,
		percentage: 0,
	};

	return null;
}

async function recalculateCpuUsage() {
	try {
		const statFile = await readFileAsync("/proc/stat");

		console.assert(
			statFile.startsWith("cpu "),
			"couldn't parse /proc/stat",
		);

		const cpuStats = statFile
			.split("\n")
			.filter((part) => part.startsWith("cpu"));

		const cpuStatsData: CPUInfo = {};

		for (const cpuStat of cpuStats) {
			const cpuData = cpuStat.split(" ");

			const coreNumber = cpuData.shift()?.replace("cpu", "") || "total";
			const coreValues = cpuData
				.filter(Boolean)
				.map((value) => parseInt(value));

			const coreData = getCoreInfo(coreNumber, coreValues);

			if (coreData) cpuStatsData[coreNumber] = coreData;
		}

		if (Object.keys(cpuStatsData).length > 0) setCpuUsage(cpuStatsData);
	} catch (error) {
		console.error(error);
	}
}

async function recalculateMemoryUsage() {
	try {
		const memoryInfo = await execAsync("free -h");

		const [
			,
			totalRam,
			usedRam,
			freeRam,
			_sharedRam,
			_bufferCacheRam,
			availableRam,
		] = memoryInfo.split("\n")[1].split(/\s+/);
		const [, totalSwap, usedSwap, freeSwap] = memoryInfo
			.split("\n")[2]
			.split(/\s+/);

		setMemoryUsage({
			memory: {
				available: availableRam.replace(",", "."),
				total: totalRam.replace(",", "."),
				free: freeRam.replace(",", "."),
				used: usedRam.replace(",", "."),
				usage:
					(parseFloat(usedRam.replace(",", ".")) /
						parseFloat(totalRam.replace(",", "."))) *
					100,
			},
			swap: {
				total: totalSwap.replace(",", "."),
				used: usedSwap.replace(",", "."),
				free: freeSwap.replace(",", "."),
				usage:
					(parseFloat(usedSwap.replace(",", ".")) /
						parseFloat(totalSwap.replace(",", "."))) *
					100,
			},
		});
	} catch (error) {
		console.error(error);
	}
}

let lastNetworkInfo: NetworkStat | null = null;
let lastInterface: string | null = null;

async function getMainNetworkInterface(): Promise<string | undefined> {
	try {
		const interfaces = await execAsync("ip a show dynamic");

		const interfaceHeaderRegex = /^\d+: ([^:]+): .*/gm;

		const match = interfaceHeaderRegex.exec(interfaces);

		if (!match) return undefined;

		return match[1];
	} catch (error) {
		console.error(error);
		return undefined;
	}
}

const network = Network.get_default();

network.connect("notify::primary", (source) => {
	setNetworkUsage((prev) => {
		let icon = prev.icon;

		if (source.primary === Network.Primary.WIFI) {
			icon = network.wifi.iconName;
		} else if (source.primary === Network.Primary.WIRED) {
			icon = network.wired.iconName;
		} else {
			icon = "network-offline-symbolic";
		}

		return {
			...prev,
			isWifi: source.primary === Network.Primary.WIFI,
			isWired: source.primary === Network.Primary.WIRED,
			ssid: source.wifi?.ssid,
			frequency: source.wifi?.frequency,
			strength: source.wifi?.strength,
			icon,
		};
	});
});

async function recalculateNetworkUsage() {
	try {
		const netFile = await readFileAsync("/proc/net/dev");
		const mainInterface = await getMainNetworkInterface();

		if (!mainInterface) return;

		const lines = netFile.split("\n").slice(2);
		for (const line of lines) {
			if (!line.trim()) continue;

			const [iface, ...fields] = line
				.trim()
				.split(/:|\s+/)
				.filter(Boolean);

			if (iface === mainInterface) {
				const rx = parseInt(fields[0], 10);
				const tx = parseInt(fields[8], 10);

				let icon = "network-offline-symbolic";

				if (network.primary === Network.Primary.WIFI) {
					icon = network.wifi.iconName;
				} else if (network.primary === Network.Primary.WIRED) {
					icon = network.wired.iconName;
				} else {
					icon = "network-offline-symbolic";
				}

				const networkInfo: NetworkStat = {
					rx,
					tx,
					interface: mainInterface,
					isWifi: network.primary === Network.Primary.WIFI,
					isWired: network.primary === Network.Primary.WIRED,
					ssid: network.wifi?.ssid,
					frequency: network.wifi?.frequency,
					strength: network.wifi?.strength,
					icon,
				};

				if (lastNetworkInfo && mainInterface === lastInterface) {
					const newNetStats: NetworkStat = {
						rx: networkInfo.rx - lastNetworkInfo.rx,
						tx: networkInfo.tx - lastNetworkInfo.tx,
						interface: mainInterface,
						isWifi: network.primary === Network.Primary.WIFI,
						isWired: network.primary === Network.Primary.WIRED,
						ssid: network.wifi?.ssid,
						frequency: network.wifi?.frequency,
						strength: network.wifi?.strength,
						icon,
					};

					setNetworkUsage(newNetStats);
				}

				lastNetworkInfo = networkInfo;
				lastInterface = mainInterface ?? null;

				break;
			}
		}
	} catch (error) {
		console.error(error);
	}
}

export function formatNetworkThroughput(value: number, unitIndex = 0) {
	// I don't think anyone has exabit internet yet
	const UNITS = ["B", "kB", "MB", "GB", "TB"];

	// never show in bytes, since it's one letter

	unitIndex += 1;
	value /= 1000;

	if (value < 10) {
		return `${value.toFixed(2)} ${UNITS[unitIndex]}/s`;
	}

	if (value < 100) {
		return `${value.toFixed(1)} ${UNITS[unitIndex]}/s`;
	}

	if (value < 1000) {
		return `${(value / 1000).toFixed(2)} ${UNITS[unitIndex + 1]}/s`;
	}

	// do not increase here since it's done at the start of the function
	return formatNetworkThroughput(value, unitIndex);
}

async function recalculateDiskUsage() {
	try {
		const rawDiskData = await execAsync("df -h /");

		const [device, totalSize, usedSize, availableSize, usagePercent, path] =
			rawDiskData.split("\n")[1].split(/\s+/g);

		setDiskUsage({
			device,
			totalSize,
			usedSize,
			availableSize,
			usagePercent,
			path,
		});
	} catch (error) {
		console.error(error);
	}
}

function handleInterval() {
	recalculateCpuUsage();
	recalculateDiskUsage();
	recalculateMemoryUsage();
	recalculateNetworkUsage();
}

let currentInterval =
	config.get()?.systemStatsUpdateInterval ||
	defaultConfig.systemStatsUpdateInterval;
let systemStatsInterval = interval(currentInterval, handleInterval);

config.subscribe(() => {
	const newConfig = config.get();

	if (newConfig.systemStatsUpdateInterval !== currentInterval) {
		systemStatsInterval.cancel();

		currentInterval =
			newConfig?.systemStatsUpdateInterval ||
			defaultConfig.systemStatsUpdateInterval;
		systemStatsInterval = interval(currentInterval, handleInterval);
	}
});
