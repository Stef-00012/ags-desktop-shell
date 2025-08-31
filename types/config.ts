type _Config = {
	paths: ConfigPaths;
	volumeStep: ConfigVolumeStep;
	animationsDuration: ConfigAnimationsDuration;
	animationsType: ConfigAnimationsTypes;
	players: ConfigPlayers;
	timeouts: ConfigTimeouts;
	sessionMenu: ConfigSessionMenu;
	mediaMaxLength: number; // in seconds
	systemStatsUpdateInterval: number; // in ms
};

export type Config = Partial<_Config>;

type ConfigPaths = {
	musixmatchToken: string; // absolute path, must be a json
	backlightBaseDir: string; // absolute path
	saveFolder: string; // absolute path
	lyricsFolder: string; // absolute path
};

type ConfigSessionMenu = {
	buttonWidth: number; // in px
	buttonHeight: number; // in px
	buttonGap: number; // in px
};

type ConfigVolumeStep = {
	media: number; // 0-1
	microphone: number; // 0-1
	speaker: number; // 0-1
};

type ConfigAnimationsDuration = {
	notification: number; // in ms
	launcher: number; // in ms
	notificationCenter: number; // in ms
	osd: number; // in ms
	sessionMenu: number; // in ms
	mediaPlayer: number; // in ms
};

type ConfigAnimationsTypes = {
	notification: AnimationType;
	launcher: AnimationType;
	notificationCenter: AnimationType;
	osd: AnimationType;
	sessionMenu: AnimationType;
	mediaPlayer: AnimationType;
};

type ConfigPlayers = {
	blacklisted: string[],
	preferred: string[],
}

type ConfigTimeouts = {
	osd: number; // in ms
	defaultNotificationExpire: number; // in ms
};

export type AnimationType =
	| "CROSSFADE"
	| "NONE"
	| "SLIDE_DOWN"
	| "SLIDE_LEFT"
	| "SLIDE_RIGHT"
	| "SLIDE_UP"
	| "SWING_DOWN"
	| "SWING_LEFT"
	| "SWING_RIGHT"
	| "SWING_UP";
