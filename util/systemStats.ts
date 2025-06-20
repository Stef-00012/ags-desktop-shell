/*
	Modified version of:
	https://github.com/Mabi19/desktop-shell/blob/d70189b2355a4173a8ea6d5699f340fe73497945/utils/system-stats.ts
*/

import { readFileAsync } from "ags/file";
import { exec } from "ags/process";
import { interval } from "ags/time";
import { createState } from "ags";
import type {
	CoreInfo,
	CPUInfo,
	NetworkStat,
	MemoryStat,
	DiskStat
} from "@/types/systemStats"



const UPDATE_INTERVAL = 1000;

export const [cpuUsage, setCpuUsage] = createState<CPUInfo>({
	total: {
		idle: 0,
		total: 0,
		percentage: 0,
	}
});

export const [memoryUsage, setMemoryUsage] = createState<MemoryStat>({
	available: 0,
	total: 0,
	usage: 0,
});

/// A device name -> total network received / transmitted bytes per second
export const [networkUsage, setNetworkUsage] = createState<NetworkStat>({
	rx: 0,
	tx: 0,
	interface: "Unknown",
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
			percentage: ((deltaTotal - deltaIdle) / deltaTotal) * 100,
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
	const statFile = await readFileAsync("/proc/stat");

	console.assert(statFile.startsWith("cpu "), "couldn't parse /proc/stat");

	const cpuStats = statFile
		.split("\n")
		.filter((part) => part.startsWith("cpu"));

	const cpuStatsData: CPUInfo = {};

	for (const cpuStat of cpuStats) {
		const cpuData = cpuStat.split(" ");

		const coreNumber = cpuData.shift()?.replace("cpu", "") || "total";
		const coreValues = cpuData.filter(Boolean).map((value) => parseInt(value));

		const coreData = getCoreInfo(coreNumber, coreValues);

		if (coreData) cpuStatsData[coreNumber] = coreData;
	}

	if (Object.keys(cpuStatsData).length > 0) setCpuUsage(cpuStatsData);
}

async function recalculateMemoryUsage() {
	const memoryInfo = await readFileAsync("/proc/meminfo");

	let total = null;
	let available = null;

	for (const line of memoryInfo.split("\n")) {
		if (!line) continue;

		if (total && available) {
			// we have everything
			break;
		}

		let [label, rest] = line.split(":");
		rest = rest.trim();

		console.assert(
			rest.endsWith("kB"),
			`memory stat has unexpected unit ${rest}`,
		);

		rest = rest.slice(0, -3);
		const amount = parseInt(rest);

		if (label === "MemTotal") {
			total = amount;
		} else if (label === "MemAvailable") {
			available = amount;
		}
	}

	if (!total || !available) {
		console.error("couldn't parse /proc/meminfo");
		return;
	}
	// KiB
	setMemoryUsage({
		available, // KiB
		total, // KiB
		usage: (1 - available / total) * 100,
	});
}

let lastNetworkInfo: NetworkStat | null = null;
let lastInterface: string | null = null;

function getMainNetworkInterface(): string | undefined {
	const ifconfig = exec("ifconfig");
	const interfaceBlocks = ifconfig.split(/\n(?=\w+?: flags=)/);

	for (const block of interfaceBlocks) {
		const lines = block.split("\n");
		const header = lines[0];
		const match = header.match(/^(\w+):\s/);

		if (!match) continue;

		const iface = match[1];

		let hasRealIp = false;

		for (const line of lines) {
			const ipv4Match = line.match(/\binet\s+(\d+\.\d+\.\d+\.\d+)/);

			if (ipv4Match && ipv4Match[1] !== "127.0.0.1") {
				hasRealIp = true;

				break;
			}

			const ipv6Match = line.match(/\binet6\s+([a-fA-F0-9:]+)/);

			if (ipv6Match && ipv6Match[1] !== "::1") {
				hasRealIp = true;

				break;
			}
		}

		if (hasRealIp) return iface;
	}

	return undefined;
}

async function recalculateNetworkUsage() {
	const netFile = await readFileAsync("/proc/net/dev");
	const mainInterface = getMainNetworkInterface();

	if (!mainInterface) return;

	const lines = netFile.split("\n").slice(1, -1);
	const [rxLabels, txLabels] = lines[0]
		.split("|")
		.slice(1)
		.map((str) => str.trim().split(/\W+/));

	const rxBytesIdx = rxLabels.indexOf("bytes");
	const txBytesIdx = rxLabels.length + txLabels.indexOf("bytes");

	const rawStat = lines
		.slice(1)
		.map((line) => line.trim().split(/\W+/))
		.filter((data) => data[0] === mainInterface)[0];

	const networkInfo: NetworkStat = {
		rx: parseInt(rawStat[rxBytesIdx + 1]),
		tx: parseInt(rawStat[txBytesIdx + 1]),
		interface: mainInterface,
	};

	if (lastNetworkInfo && mainInterface === lastInterface) {
		const newNetStats: NetworkStat = {
			rx: (networkInfo.rx - lastNetworkInfo.rx) / (UPDATE_INTERVAL / 1000),
			tx: (networkInfo.tx - lastNetworkInfo.tx) / (UPDATE_INTERVAL / 1000),
			interface: mainInterface,
		};

		setNetworkUsage(newNetStats);
	}

	lastNetworkInfo = networkInfo;
	lastInterface = mainInterface ?? null;
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
	const rawDiskData = exec("df -h /");

	const [device, totalSize, usedSize, availableSize, usagePercent, path] =
		rawDiskData
			.split("\n")[1]
			.split(" ")
			.map((x) => x.trim())
			.filter(Boolean);

	setDiskUsage({
		device,
		totalSize,
		usedSize,
		availableSize,
		usagePercent,
		path,
	});
}

interval(UPDATE_INTERVAL, () => {
	recalculateCpuUsage();
	recalculateDiskUsage();
	recalculateMemoryUsage();
	recalculateNetworkUsage();
});
