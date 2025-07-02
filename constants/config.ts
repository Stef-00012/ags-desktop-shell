import GLib from "gi://GLib";

export const HOME = GLib.getenv("HOME");

export const MUSIXMATCH_TOKEN_PATH = "/tmp/musixmatch_token.json";

export const MEDIA_VOLUME_STEP = 0.05; // 5%
export const MEDIA_MAX_LENGTH = 25;

export const MICROPHONE_VOLUME_STEP = 0.05; // 5%

export const SPEAKER_VOLUME_STEP = 0.05; // 5%

export const DEFAULT_NOTIFICATION_EXPIRE_TIMEOUT = 5000; // 5 seconds

export const BACKLIGHT_BASE_DIR = "/sys/class/backlight";
export const OSD_TIMEOUT_TIME = 3000; // 3 seconds

export const SYSTEM_STATS_UPDATE_INTERVAL = 1000;

export const SAVE_FOLDER = `${HOME}/Music/spotifyData`;

export const SESSION_MENU_BUTTON_WIDTH = 120;
export const SESSION_MENU_BUTTON_HEIGHT = 120;
export const SESSION_MENU_BUTTON_GAP = 50;

export const NOTIFICATION_ANIMATION_DURATION = 500; // 0.5 seconds
