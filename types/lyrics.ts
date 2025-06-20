export type Sources = ("musixmatch" | "lrclib" | "netease")[];

export interface TokenData {
	cookies: string | undefined;
	usertoken: string;
	expiresAt: number;
}

export interface Metadata {
    track?: string;
    album?: string;
    length?: number;
    artist?: string;
    trackId?: string;
    lyricsType?: "lineSynced";
}

// This is not the full response, just the data used by my script
export type UsertokenResponse = {
    message: {
        header: {
            status_code: number;
            hint: never;
        };
        body: {
            user_token: string;
        };
    };
} | {
    message: {
        header: {
            status_code: number;
            hint: string;
        };
        body: never;
    };
}

export interface MusixmatchSearchResult {
	hasLineSyncedLyrics: boolean;
	commonTrackId: string;
	trackId: string;
}