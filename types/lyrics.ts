export type Sources = "Musixmatch" | "lrclib.net" | "Local File"; // | "netease";

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
}

// This is not the full response, just the data used by my script
export type UsertokenResponse =
	| {
			message: {
				header: {
					status_code: number;
					hint: never;
				};
				body: {
					user_token: string;
				};
			};
	  }
	| {
			message: {
				header: {
					status_code: number;
					hint: string;
				};
				body: never;
			};
	  };

export interface MusixmatchSearchResult {
	hasLineSyncedLyrics: boolean;
	commonTrackId: string;
	trackId: string;
}

export interface FormattedLyric {
	time: number;
	text: string;
}

export interface SongData {
	artist: string;
	track: string;
	album: string;
	trackId: string;
	lyrics?: FormattedLyric[];
	source: Sources;
	length: number;
	cover?: string;
	volume: number;
	position: number;
}

export interface LyricsOutput {
	source: SongData["source"];
	lineSynced: string;
}

export interface FormattedLyrics {
	source: SongData["source"];
	lyrics: FormattedLyric[];
	trackId: string;
}

export interface ParsedLyrics {
	previous: string[];
	current: string;
	next: string[];
	source: SongData["source"];
}
