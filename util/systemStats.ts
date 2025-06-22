/*
	Modified version of:
	https://github.com/Mabi19/desktop-shell/blob/d70189b2355a4173a8ea6d5699f340fe73497945/utils/system-stats.ts
*/

import Battery from "gi://AstalBattery";
import Wp from "gi://AstalWp";
import Network from "gi://AstalNetwork";

import { readFileAsync } from "ags/file";
import { exec } from "ags/process";
import { interval } from "ags/time";
import { createState } from "ags";
import type {
	CoreInfo,
	CPUInfo,
	NetworkStat,
	MemoryStat,
	DiskStat,
	BatteryStat,
	SpeakerStat,
	MicrophoneStat,
} from "@/types/systemStats";

const UPDATE_INTERVAL = 1000;

const battery = Battery.get_default();

export const [batteryStat, setBatteryStat] = createState<BatteryStat>({
	isPresent: battery.isPresent,
	capacity: battery.capacity,
	isCharging: battery.charging,
	percentage: battery.percentage * 100,
	timeToFull: battery.timeToFull,
	timeToEmpty: battery.timeToEmpty,
	energyRate: battery.energyRate,
	temperature: battery.temperature,
	warningLevel: battery.warningLevel,
	voltage: battery.voltage,
});

function updateBatteryStat(bat: Battery.Device) {
	setBatteryStat({
		isPresent: bat.isPresent,
		isCharging: bat.charging,
		percentage: bat.percentage * 100,
		timeToFull: bat.timeToFull,
		timeToEmpty: bat.timeToEmpty,
		capacity: bat.capacity,
		energyRate: bat.energyRate,
		temperature: bat.temperature,
		warningLevel: bat.warningLevel,
		voltage: bat.voltage,
	});
}

battery.connect("notify::charging", updateBatteryStat);
battery.connect("notify::percentage", updateBatteryStat);
battery.connect("notify::energy-rate", updateBatteryStat);

const wp = Wp.get_default();

export const [speakerStat, setSpeakerStat] = createState<SpeakerStat>({
	name: wp?.audio.defaultSpeaker.name || "Unknown",
	muted: wp?.audio.defaultSpeaker.mute || false,
	volume: Math.round((wp?.audio.defaultSpeaker.volume || 0) * 100),
	api: wp?.audio.defaultSpeaker.get_pw_property("device.api") || "Unknown",
	isBluetooth:
		wp?.audio.defaultSpeaker.get_pw_property("device.api") === "bluez5",
});

export const [microphoneStat, setMicrophoneStat] = createState<MicrophoneStat>({
	name: wp?.defaultMicrophone.description || "Unknown",
	muted: wp?.defaultMicrophone.mute || false,
	volume: Math.round((wp?.defaultMicrophone.volume || 0) * 100),
	api: wp?.defaultMicrophone.get_pw_property("device.api") || "Unknown",
	isBluetooth: wp?.defaultMicrophone.get_pw_property("device.api") === "bluez5",
});

function updateSpeakerStat(speaker: Wp.Endpoint) {
	const api = speaker.get_pw_property("device.api");

	setSpeakerStat({
		name: speaker.description,
		muted: speaker.mute,
		volume: Math.round(speaker.volume * 100),
		api,
		isBluetooth: api === "bluez5",
	});
}

function updateMicrophoneStat(microphone: Wp.Endpoint) {
	const api = microphone.get_pw_property("device.api");

	setMicrophoneStat({
		name: microphone.description,
		muted: microphone.mute,
		volume: Math.round(microphone.volume * 100),
		api,
		isBluetooth: api === "bluez5",
	});
}

const defaultSpeaker = wp?.audio.defaultSpeaker;
const defaultMicrophone = wp?.audio.defaultMicrophone;

defaultSpeaker?.connect("notify::mute", updateSpeakerStat);
defaultSpeaker?.connect("notify::volume", updateSpeakerStat);
defaultSpeaker?.connect("notify::device-id", updateSpeakerStat);

defaultMicrophone?.connect("notify::mute", updateMicrophoneStat);
defaultMicrophone?.connect("notify::volume", updateMicrophoneStat);
defaultMicrophone?.connect("notify::device-id", updateMicrophoneStat);

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
			// percentage: ((deltaTotal - deltaIdle) / deltaTotal) * 100,
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
	const memoryInfo = exec("free -h");

	const [
		,
		totalRam,
		usedRam,
		freeRam,
		sharedRam,
		bufferCacheRam,
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

// async function recalculateNetworkUsage() {
// 	const netFile = await readFileAsync("/proc/net/dev");
// 	const mainInterface = getMainNetworkInterface();

// 	if (!mainInterface) return;

// 	const lines = netFile.split("\n").slice(1, -1);
// 	const [rxLabels, txLabels] = lines[0]
// 		.split("|")
// 		.slice(1)
// 		.map((str) => str.trim().split(/\W+/));

// 	const rxBytesIdx = rxLabels.indexOf("bytes");
// 	const txBytesIdx = rxLabels.length + txLabels.indexOf("bytes");

// 	const rawStat = lines
// 		.slice(1)
// 		.map((line) => line.trim().split(/\W+/))
// 		.filter((data) => data[0] === mainInterface)[0];

// 	const networkInfo: NetworkStat = {
// 		rx: parseInt(rawStat[rxBytesIdx + 1]),
// 		tx: parseInt(rawStat[txBytesIdx + 1]),
// 		interface: mainInterface,
// 	};

// 	if (lastNetworkInfo && mainInterface === lastInterface) {
// 		const newNetStats: NetworkStat = {
// 			rx: (networkInfo.rx - lastNetworkInfo.rx) / (UPDATE_INTERVAL / 1000),
// 			tx: (networkInfo.tx - lastNetworkInfo.tx) / (UPDATE_INTERVAL / 1000),
// 			interface: mainInterface,
// 		};

// 		setNetworkUsage(newNetStats);
// 	}

// 	lastNetworkInfo = networkInfo;
// 	lastInterface = mainInterface ?? null;
// }

/* using waybar-like code to calculate network usage */
async function recalculateNetworkUsage() {
	const netFile = await readFileAsync("/proc/net/dev");
	const mainInterface = getMainNetworkInterface();
	const network = Network.get_default();

	if (!mainInterface) return;

	const lines = netFile.split("\n").slice(2);
	for (const line of lines) {
		if (!line.trim()) continue;

		const [iface, ...fields] = line.trim().split(/:|\s+/).filter(Boolean);

		if (iface === mainInterface) {
			const rx = parseInt(fields[0], 10);
			const tx = parseInt(fields[8], 10);

			const networkInfo: NetworkStat = {
				rx,
				tx,
				interface: mainInterface,
				isWifi: !!network.wifi,
				isWired: !!network.wired,
				ssid: network.wifi?.ssid,
				frequency: network.wifi?.frequency,
				strength: network.wifi?.strength,
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
				};

				setNetworkUsage(newNetStats);
			}

			lastNetworkInfo = networkInfo;
			lastInterface = mainInterface ?? null;

			break;
		}
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
	const rawDiskData = exec("df -h /");

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
}

interval(UPDATE_INTERVAL, () => {
	recalculateCpuUsage();
	recalculateDiskUsage();
	recalculateMemoryUsage();
	recalculateNetworkUsage();
});
