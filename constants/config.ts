import type { AnimationType, Config } from "@/types/config";
import GLib from "gi://GLib";

export const HOME = GLib.getenv("HOME");

export const animationTypes: AnimationType[] = [
	"CROSSFADE",
	"NONE",
	"SLIDE_DOWN",
	"SLIDE_LEFT",
	"SLIDE_RIGHT",
	"SLIDE_UP",
	"SWING_DOWN",
	"SWING_LEFT",
	"SWING_RIGHT",
	"SWING_UP",
];

export const configFolder = `${HOME}/.config/stef-shell`;
export const configFilePath = `${configFolder}/config.json`;

export const defaultConfig = {
	paths: {
		musixmatchToken: "/tmp/musixmatch_token.json",
		backlightBaseDir: "/sys/class/backlight", // requires restart to apply changes
		saveFolder: `${HOME}/Music/spotifyData`,
		lyricsFolder: `${configFolder}/lyrics`,
	},
	volumeStep: {
		media: 0.05, // 5%
		microphone: 0.05, // 5%
		speaker: 0.05, // 5%
	},
	animationsDuration: {
		notification: 500, // 0.5 seconds
		launcher: 300, // 0.3 seconds
		notificationCenter: 500, // 0.5 seconds
		osd: 300, // 0.3 seconds
		sessionMenu: 300, // 0.3 seconds
	},
	animationsType: {
		notification: "SLIDE_LEFT",
		launcher: "CROSSFADE",
		notificationCenter: "SLIDE_LEFT",
		osd: "CROSSFADE",
		sessionMenu: "CROSSFADE",
	},
	timeouts: {
		osd: 3000, // 3 seconds
		defaultNotificationExpire: 5000, // 5 seconds
	},
	sessionMenu: {
		buttonWidth: 120, // in px
		buttonHeight: 120, // in px
		buttonGap: 50, // in px
	},
	mediaMaxLength: 25,
	systemStatsUpdateInterval: 1000,
} satisfies Config;
