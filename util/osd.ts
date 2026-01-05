import { isSessionMenuVisible } from "@/app";
import { defaultConfig } from "@/constants/config";
import { createComputed, createState } from "ags";
import { monitorFile, readFileAsync } from "ags/file";
import { timeout } from "ags/time";
import type AstalIO from "gi://AstalIO";
import Wp from "gi://AstalWp";
import GLib from "gi://GLib";
import { config } from "./config";

const wp = Wp.get_default();

const defaultSpeaker = wp?.audio.defaultSpeaker;
const defaultMicrophone = wp?.audio.defaultMicrophone;

let lastTimeout: AstalIO.Time;
let isStartup = true;

timeout(300, () => {
	isStartup = false;
});

const [isOSDVisible, setIsOSDVisible] = createState(false);
export const OSDVisibleState = createComputed(() =>
	transformVisibleState(isOSDVisible(), isSessionMenuVisible()),
);

export const [OSDState, setOSDState] = createState<{
	type: "speaker" | "microphone" | "brightness";
	percentage: number;
	mute: boolean;
	icon: string;
}>({
	type: "speaker",
	percentage: defaultSpeaker?.volume || 0,
	mute: defaultSpeaker?.mute || true,
	icon: defaultSpeaker?.icon || "audio-volume-muted-symbolic",
});

defaultSpeaker?.connect("notify::volume", updateSpeakerState);
defaultSpeaker?.connect("notify::mute", updateSpeakerState);

defaultMicrophone?.connect("notify::volume", updateMicrophoneState);
defaultMicrophone?.connect("notify::mute", updateMicrophoneState);

const dir = GLib.Dir.open(
	config.peek().paths?.backlightBaseDir ??
		defaultConfig.paths.backlightBaseDir,
	0,
);
const backlightDirName = dir.read_name();

if (backlightDirName) {
	const backlightCurrentPath = `${config.peek().paths?.backlightBaseDir ?? defaultConfig.paths.backlightBaseDir}/${backlightDirName}/brightness`;
	const backlightMaxPath = `${config.peek().paths?.backlightBaseDir ?? defaultConfig.paths.backlightBaseDir}/${backlightDirName}/max_brightness`;

	monitorFile(backlightCurrentPath, async () => {
		const [currentString, maxString] = await Promise.all([
			readFileAsync(backlightCurrentPath),
			readFileAsync(backlightMaxPath),
		]);

		if (isStartup) return;

		setOSDState({
			type: "brightness",
			percentage: parseInt(currentString, 10) / parseInt(maxString, 10),
			mute: false,
			icon: "display-brightness-symbolic",
		});

		setIsOSDVisible(true);

		if (lastTimeout) lastTimeout.cancel();
		lastTimeout = timeout(
			config.peek().timeouts?.osd ?? defaultConfig.timeouts.osd,
			() => {
				setIsOSDVisible(false);
			},
		);
	});
}

function transformVisibleState(isVisible: boolean, hidden: boolean) {
	return isVisible && !hidden;
}

function updateSpeakerState(speaker: Wp.Endpoint) {
	if (isStartup) return;

	let icon = speaker.volumeIcon;

	if (speaker.volume === 0) icon = "audio-volume-muted-symbolic";
	else if (Math.round(speaker.volume * 100) === 100)
		icon = "audio-volume-high-symbolic";

	setOSDState({
		type: "speaker",
		percentage: speaker.volume,
		mute: speaker.mute,
		icon: icon,
	});

	setIsOSDVisible(true);

	if (lastTimeout) lastTimeout.cancel();
	lastTimeout = timeout(
		config.peek().timeouts?.osd ?? defaultConfig.timeouts.osd,
		() => {
			setIsOSDVisible(false);
		},
	);
}

function updateMicrophoneState(microphone: Wp.Endpoint) {
	if (isStartup) return;

	let icon = microphone.volumeIcon;

	if (microphone.volume === 0) icon = "microphone-sensitivity-muted-symbolic";

	setOSDState({
		type: "microphone",
		percentage: microphone.volume,
		mute: microphone.mute,
		icon: icon,
	});

	setIsOSDVisible(true);

	if (lastTimeout) lastTimeout.cancel();
	lastTimeout = timeout(
		config.peek().timeouts?.osd ?? defaultConfig.timeouts.osd,
		() => {
			setIsOSDVisible(false);
		},
	);
}
