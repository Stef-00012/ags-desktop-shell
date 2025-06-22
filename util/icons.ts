import {
	audioIcons,
	batteryIcons,
	clockIcons,
	cpuIcon,
	diskIcon,
	memoryIcon,
	networkIcons,
} from "@/constants/icons";

export function getBatteryIcon(percent: number, isCharging?: boolean): string {
	if (isCharging) return batteryIcons.charging;

	const perc = Math.max(0, Math.min(100, percent));

	let index = 0;

	if (perc === 100) {
		index = 10;
	} else {
		index = Math.floor(perc / 10);

		if (index > 9) index = 9;
	}

	return batteryIcons.percents[index];
}

type NetworkIconProps = {
	isWifi: boolean;
	isWired: boolean;
	strength?: number;
};

export function getNetworkIcon({
	isWifi,
	isWired,
	strength = 0,
}: NetworkIconProps): string {
	if (isWifi) {
		return getWifiIcon(strength);
	}

	if (isWired) {
		return networkIcons.ethernetIcon;
	}

	return networkIcons.wifiDisconnected;
}

function getWifiIcon(strength: number): string {
	const str = Math.max(0, Math.min(100, strength));

	let index = 0;

	if (str === 100) {
		index = 4;
	} else {
		index = Math.floor(str / 20);
		if (index > 3) index = 3;
	}
	return networkIcons.wifiIcons[index];
}

export function getSpeakerIcon(percent: number, isMuted: boolean): string {
	if (isMuted) return audioIcons.speakerMuted;

	const perc = Math.max(0, Math.min(150, percent));

	let index = 0;

	if (perc < 30) index = 0;
	else if (perc < 65) index = 1;
	else index = 2;

	return audioIcons.speaker[index];
}

export function getMicrohponeIcon(isMuted: boolean): string {
	if (isMuted) return audioIcons.microphoneMuted;

	return audioIcons.microphone;
}

export function getCPUIcon(): string {
	return cpuIcon;
}

export function getDiskIcon(): string {
	return diskIcon;
}

export function getMemoryIcon(): string {
	return memoryIcon;
}

export function getClockIcon(type: "clock" | "calendar"): string {
	return clockIcons[type];
}
