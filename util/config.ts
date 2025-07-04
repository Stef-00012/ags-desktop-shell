import { monitorFile, readFile } from "ags/file";
import type { Config } from "@/types/config";
import { fileExists } from "@/util/file";
import { createState } from "ags";
import Gio from "gi://Gio";
import {
	animationTypes,
	configFilePath,
	defaultConfig,
} from "@/constants/config";

export const [config, setConfig] = createState<Config>(defaultConfig);

if (fileExists(configFilePath)) {
	updateConfig();
}

monitorFile(configFilePath, (_, event) => {
	if (event === Gio.FileMonitorEvent.CHANGED) {
		console.log("Config file changed, updating config");

		updateConfig();
	}

	if (event === Gio.FileMonitorEvent.DELETED) {
		console.warn("Config file deleted, restoring default config");

		setConfig(defaultConfig);
	}

	if (event === Gio.FileMonitorEvent.CREATED) {
		console.log("Config file created, updating config");

		updateConfig();
	}
});

function updateConfig() {
	const data = readFile(configFilePath);

	try {
		const configData: Partial<Config> = JSON.parse(data);

		if (!validateConfig(configData)) return;

		setConfig(configData);
	} catch (e) {
		console.error("Failed to read the config file\nError:", e);
	}
}

function validateConfig(config: Partial<Config>): boolean {
	if (
		config.paths?.musixmatchToken &&
		(!config.paths?.musixmatchToken.startsWith("/") ||
			!config.paths.musixmatchToken.endsWith(".json"))
	) {
		console.error(
			"Invalid `paths.musixmatchTokenPath` (must be an absolute path to a JSON file):",
			config.paths?.musixmatchToken,
		);
		return false;
	}

	if (
		config.paths?.backlightBaseDir &&
		(!config.paths.backlightBaseDir.startsWith("/") ||
			!fileExists(config.paths.backlightBaseDir, true))
	) {
		console.error(
			"Invalid `paths.backlightBaseDir` (must be an absolute path to backlight base folder):",
			config.paths.backlightBaseDir,
		);
		return false;
	}

	if (config.paths?.saveFolder && !config.paths.saveFolder.startsWith("/")) {
		console.error(
			"Invalid `paths.saveFolder` (must be an absolute path to save folder):",
			config.paths.saveFolder,
		);
		return false;
	}

	if (
		config.volumeStep?.media &&
		(config.volumeStep.media < 0 || config.volumeStep.media > 1)
	) {
		console.error(
			"Invalid `volumeStep.media` (must be between 0 and 1):",
			config.volumeStep.media,
		);
		return false;
	}

	if (
		config.volumeStep?.microphone &&
		(config.volumeStep.microphone < 0 || config.volumeStep.microphone > 1)
	) {
		console.error(
			"Invalid `volumeStep.microphone` (must be between 0 and 1):",
			config.volumeStep.microphone,
		);
		return false;
	}

	if (
		config.volumeStep?.speaker &&
		(config.volumeStep.speaker < 0 || config.volumeStep.speaker > 1)
	) {
		console.error(
			"Invalid `volumeStep.speaker` (must be between 0 and 1):",
			config.volumeStep.speaker,
		);
		return false;
	}

	if (
		config.animationsDuration?.notification &&
		config.animationsDuration.notification < 0
	) {
		console.error(
			"Invalid `animationsDuration.notification` (must be greater or equal to 0):",
			config.animationsDuration.notification,
		);
		return false;
	}

	if (
		config.animationsDuration?.launcher &&
		config.animationsDuration.launcher < 0
	) {
		console.error(
			"Invalid `animationsDuration.launcher` (must be greater or equal to 0):",
			config.animationsDuration.launcher,
		);
		return false;
	}

	if (
		config.animationsDuration?.notificationCenter &&
		config.animationsDuration.notificationCenter < 0
	) {
		console.error(
			"Invalid `animationsDuration.notificationCenter` (must be greater or equal to 0):",
			config.animationsDuration.notificationCenter,
		);
		return false;
	}

	if (config.animationsDuration?.osd && config.animationsDuration.osd < 0) {
		console.error(
			"Invalid `animationsDuration.osd` (must be greater or equal to 0):",
			config.animationsDuration.osd,
		);
		return false;
	}

	if (
		config.animationsDuration?.sessionMenu &&
		config.animationsDuration.sessionMenu < 0
	) {
		console.error(
			"Invalid `animationsDuration.sessionMenu` (must be greater or equal to 0):",
			config.animationsDuration.sessionMenu,
		);
		return false;
	}

	if (
		config.animationsType?.notification &&
		!animationTypes.includes(config.animationsType.notification)
	) {
		console.error(
			`Invalid \`animationsType.notification\` (must be one of ${animationTypes.map((type) => `"${type}"`).join(", ")}):`,
			config.animationsType.notification,
		);
		return false;
	}

	if (
		config.animationsType?.launcher &&
		!animationTypes.includes(config.animationsType.launcher)
	) {
		console.error(
			`Invalid \`animationsType.launcher\` (must be one of ${animationTypes.map((type) => `"${type}"`).join(", ")}):`,
			config.animationsType.launcher,
		);
		return false;
	}

	if (
		config.animationsType?.notificationCenter &&
		!animationTypes.includes(config.animationsType.notificationCenter)
	) {
		console.error(
			`Invalid \`animationsType.notificationCenter\` (must be one of ${animationTypes.map((type) => `"${type}"`).join(", ")}):`,
			config.animationsType.notificationCenter,
		);
		return false;
	}

	if (
		config.animationsType?.osd &&
		!animationTypes.includes(config.animationsType.osd)
	) {
		console.error(
			`Invalid \`animationsType.osd\` (must be one of ${animationTypes.map((type) => `"${type}"`).join(", ")}):`,
			config.animationsType.osd,
		);
		return false;
	}

	if (
		config.animationsType?.sessionMenu &&
		!animationTypes.includes(config.animationsType.sessionMenu)
	) {
		console.error(
			`Invalid \`animationsType.sessionMenu\` (must be one of ${animationTypes.map((type) => `"${type}"`).join(", ")}):`,
			config.animationsType.sessionMenu,
		);
		return false;
	}

	if (config.timeouts?.osd && config.timeouts.osd < 0) {
		console.error(
			"Invalid `timeouts.osd` (must be greater or equal to 0):",
			config.timeouts.osd,
		);
		return false;
	}

	if (
		config.timeouts?.defaultNotificationExpire &&
		config.timeouts.defaultNotificationExpire < 0
	) {
		console.error(
			"Invalid `timeouts.defaultNotificationExpire` (must be greater or equal to 0):",
			config.timeouts.defaultNotificationExpire,
		);
		return false;
	}

	if (
		typeof config.sessionMenu?.buttonWidth === "number" &&
		config.sessionMenu.buttonWidth <= 0
	) {
		console.error(
			"Invalid `sessionMenu.buttonWidth` (must be greater than 0):",
			config.sessionMenu.buttonWidth,
		);
		return false;
	}

	if (
		typeof config.sessionMenu?.buttonHeight === "number" &&
		config.sessionMenu.buttonHeight <= 0
	) {
		console.error(
			"Invalid `sessionMenu.buttonHeight` (must be greater than 0):",
			config.sessionMenu.buttonHeight,
		);
		return false;
	}

	if (
		typeof config.sessionMenu?.buttonGap === "number" &&
		config.sessionMenu.buttonGap <= 0
	) {
		console.error(
			"Invalid `sessionMenu.buttonGap` (must be greater than 0):",
			config.sessionMenu.buttonGap,
		);
		return false;
	}

	if (config.mediaMaxLength && config.mediaMaxLength <= 0) {
		console.error(
			"Invalid `mediaMaxLength` (must be greater than 0):",
			config.mediaMaxLength,
		);
		return false;
	}

	if (
		config.systemStatsUpdateInterval &&
		config.systemStatsUpdateInterval < 100
	) {
		console.error(
			"Invalid `systemStatsUpdateInterval` (must be greater or equal to 100):",
			config.systemStatsUpdateInterval,
		);
		return false;
	}

	return true;
}
