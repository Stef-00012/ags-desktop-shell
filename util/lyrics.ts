// import { fetch, Headers, URL } from "ags/fetch";
import { fetch, Headers, URL, URLSearchParams } from "@/util/fetch";
import type {
	FormattedLyric,
	LyricsOutput,
	Metadata,
	MusixmatchSearchResult,
	SongData,
	TokenData,
	UsertokenResponse,
} from "@/types/lyrics";
import { readFile, writeFile } from "ags/file";
import Soup from "gi://Soup?version=3.0";
import { interval, timeout } from "ags/time";
import { createState } from "ags";
import Mpris from "gi://AstalMpris";

const [currentSong, setCurrentSong] = createState<SongData>({
	artist: "undefined",
	track: "undefined",
	album: "undefined",
	trackId: "",
	source: "",
	length: 0,
});

const MUSIXMATCH_TOKEN_PATH = "/tmp/musixmatch_token.json";

const sleep = (ms: number) =>
	new Promise((resolve) => timeout(ms, () => resolve(null)));

function saveMusixmatchToken(token: TokenData): void {
	writeFile(MUSIXMATCH_TOKEN_PATH, JSON.stringify(token));
}

function getMusixmatchToken(): TokenData | null {
	const content = readFile(MUSIXMATCH_TOKEN_PATH);

	if (!content) return null;

	return JSON.parse(content);
}

async function getMusixmatchUsertoken(
	cookies?: string,
): Promise<TokenData | null | undefined> {
	const tokenData = getMusixmatchToken();

	if (tokenData) return tokenData;

	const url = new URL(
		"https://apic-desktop.musixmatch.com/ws/1.1/token.get?user_language=en&app_id=web-desktop-app-v1.0",
	);

	try {
		const headers = new Headers();

		if (cookies) headers.append("cookie", cookies);

		const res = await fetch(url, {
			headers,
			flags: Soup.MessageFlags.NO_REDIRECT,
		});

		if (res.status === 301) {
			const setCookie = res.headers
				.getAll("Set-Cookie")
				.map((cookie) => cookie.split(";").shift())
				.join("; ");

			return await getMusixmatchUsertoken(setCookie);
		}

		if (!res.ok) return null;

		const data = (await res.json()) as UsertokenResponse;

		if (
			!data.message.body ||
			(data.message.header.status_code === 401 &&
				data.message.header.hint === "captcha")
		) {
			await sleep(10000);

			return await getMusixmatchUsertoken(cookies);
		}

		const usertoken = data.message.body.user_token;

		if (!usertoken) return null;

		const json: TokenData = {
			cookies,
			usertoken,
			expiresAt: new Date(Date.now() + 10 * 60 * 1000).getTime(), // 10 minutes
		};

		saveMusixmatchToken(json);

		return json;
	} catch (e) {
		return null;
	}
}

async function _searchLyricsMusixmatch(
	metadata: Metadata,
	tokenData: TokenData,
): Promise<MusixmatchSearchResult | null> {
	if (!metadata || !tokenData) return null;

	const duration = metadata.length ? metadata.length / 1000 : null;

	const searchParams = new URLSearchParams({
		app_id: "web-desktop-app-v1.0",
		usertoken: tokenData.usertoken,
		q_track: metadata.track || "",
		q_artist: metadata.artist || "",
		q_album: metadata.album || "",
		page_size: "20",
		page: "1",
		q_duration: duration?.toString() || "",
		s_track_rating: "asc",
	});

	const url = new URL(
		`https://apic-desktop.musixmatch.com/ws/1.1/track.search?${searchParams}`,
	);

	try {
		const res = await fetch(url, {
			headers: {
				cookie: tokenData.cookies || "",
			},
		});

		if (!res.ok) return null;

		const data = await res.json();

		if (
			data?.message?.header?.status_code === 401 &&
			data?.message?.header?.hint === "captcha"
		)
			return null;

		if (data?.message?.body?.track_list?.length <= 0) return null;

		const track = data?.message?.body?.track_list?.find(
			(listItem: any) =>
				listItem.track.track_name?.toLowerCase() ===
					metadata.track?.toLowerCase() &&
				listItem.track.artist_name
					?.toLowerCase()
					.includes(metadata.artist?.toLowerCase()),
		);

		if (!track) return null;

		const commonTrackId = track?.track?.commontrack_id;
		const trackId = track?.track?.track_id;
		const hasLineSyncedLyrics = track?.track?.has_subtitles;

		if (!hasLineSyncedLyrics) return null;

		return {
			hasLineSyncedLyrics,
			commonTrackId,
			trackId,
		};
	} catch (e) {
		return null;
	}
}

async function _fetchLineSyncedLyricsMusixmatch(
	tokenData: TokenData,
	commonTrackId: string,
): Promise<string | null> {
	if (!tokenData || !commonTrackId) return null;

	const searchParams: URLSearchParams = new URLSearchParams({
		app_id: "web-desktop-app-v1.0",
		usertoken: tokenData.usertoken,
		commontrack_id: commonTrackId,
	});

	const url = new URL(
		`https://apic-desktop.musixmatch.com/ws/1.1/track.subtitle.get?${searchParams}`,
	);

	try {
		const res = await fetch(url, {
			headers: {
				cookie: tokenData.cookies || "",
			},
		});

		if (!res.ok) return null;

		const data = await res.json();

		if (
			data?.message?.header?.status_code === 401 &&
			data?.message?.header?.hint === "captcha"
		)
			return null;

		const lyrics = data?.message?.body?.subtitle?.subtitle_body;

		if (!lyrics) return null;

		return lyrics;
	} catch (e) {
		return null;
	}
}

async function _fetchLyricsMusixmatch(
	metadata: Metadata,
	tokenData: TokenData,
	trackId: string,
	commonTrackId: string,
	hasLineSyncedLyrics: boolean,
): Promise<string | null> {
	if (
		!metadata ||
		(!commonTrackId && !trackId) ||
		!tokenData ||
		!hasLineSyncedLyrics
	)
		return null;

	const lyricsData = await _fetchLineSyncedLyricsMusixmatch(
		tokenData,
		commonTrackId,
	);

	return lyricsData;
}

async function _searchLyricsNetease(
	metadata: Metadata,
): Promise<string | null> {
	const searchParams: URLSearchParams = new URLSearchParams({
		limit: "10",
		type: "1",
		keywords: `${metadata.track} ${metadata.artist}`,
	});

	const url = new URL(
		`https://music.xianqiao.wang/neteaseapiv2/search?${searchParams}`,
	);

	try {
		const res = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:93.0) Gecko/20100101 Firefox/93.0",
			},
		});

		if (!res.ok) return null;

		const data = await res.json();

		if (!data?.result?.songs || data?.result?.songs?.length <= 0) return null;

		const track = data?.result?.songs?.find(
			(listItem: any) =>
				listItem.name?.toLowerCase() === metadata.track?.toLowerCase() &&
				(listItem.artists.some((artist: any) =>
					artist.name?.toLowerCase()?.includes(metadata.artist?.toLowerCase()),
				) ||
					listItem.artists.some((artist: any) =>
						artist.name
							?.toLowerCase()
							?.replace(/-/g, " ")
							?.includes(metadata.artist?.toLowerCase()?.replace(/-/g, " ")),
					)),
		);

		if (!track) return null;

		const trackId = track.id;

		return trackId;
	} catch (e) {
		return null;
	}
}

async function _fetchLyricsNetease(
	metadata: Metadata,
	trackId: string,
): Promise<string | null> {
	if (!metadata || !trackId) return null;

	const searchParams: URLSearchParams = new URLSearchParams({
		id: trackId,
	});

	const url = new URL(
		`https://music.xianqiao.wang/neteaseapiv2/lyric?${searchParams}`,
	);

	try {
		const res = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:93.0) Gecko/20100101 Firefox/93.0",
			},
		});

		if (!res.ok) return null;

		const data = await res.json();

		let lyrics = data?.lrc?.lyric;

		if (!lyrics) return null;

		lyrics = _parseNeteaseLyrics(lyrics);

		return lyrics;
	} catch (e) {
		return null;
	}
}

function _parseNeteaseLyrics(slyrics: string): string {
	const lines = slyrics.split(/\r?\n/).map((line) => line.trim());
	const lyrics: Array<string> = [];

	const creditInfo: Array<string> = [
		"\\s?作?\\s*词|\\s?作?\\s*曲|\\s?编\\s*曲?|\\s?监\\s*制?",
		".*编写|.*和音|.*和声|.*合声|.*提琴|.*录|.*工程|.*工作室|.*设计|.*剪辑|.*制作|.*发行|.*出品|.*后期|.*混音|.*缩混",
		"原唱|翻唱|题字|文案|海报|古筝|二胡|钢琴|吉他|贝斯|笛子|鼓|弦乐| 人声 ",
		"lrc|publish|vocal|guitar|program|produce|write|mix",
	];
	const creditInfoRegExp: RegExp = new RegExp(
		`^(${creditInfo.join("|")}).*(:|：)`,
		"i",
	);

	for (let i = 0; i < lines.length; i++) {
		const line: string = lines[i];
		const matchResult = line.match(/(\[.*?\])|([^\[\]]+)/g);

		if (!matchResult || matchResult.length === 1) {
			continue;
		}

		let textIndex = -1;
		for (let j = 0; j < matchResult.length; j++) {
			if (!matchResult[j].endsWith("]")) {
				textIndex = j;
				break;
			}
		}

		let text = "";

		if (textIndex > -1) {
			text = matchResult.splice(textIndex, 1)[0];
			text = text.charAt(0).toUpperCase() + normalize(text.slice(1));
		}

		const time = matchResult[0];

		if (!creditInfoRegExp.test(text)) {
			lyrics.push(`${time} ${text || ""}`);
		}
	}

	return lyrics.join("\n");
}

async function fetchLyricsLrclib(metadata: Metadata) {
	if (!metadata) return null;

	const searchParams = new URLSearchParams({
		track_name: metadata.track || "",
		artist_name: metadata.artist || "",
		album_name: metadata.album || "",
		q: metadata.track || "",
	});

	const url = new URL(`https://lrclib.net/api/search?${searchParams}`);

	try {
		const res = await fetch(url, {
			headers: {
				"Lrclib-Client":
					"Custom Linux Bar (https://github.com/Stef-00012/ags-topbar)",
				"User-Agent":
					"Custom Linux Bar (https://github.com/Stef-00012/ags-topbar)",
			},
		});

		if (!res.ok) return null;

		const data = await res.json();

		const match = data.find(
			(d: any) =>
				d.artistName?.toLowerCase().includes(metadata.artist?.toLowerCase()) &&
				d.trackName?.toLowerCase() === metadata.track?.toLowerCase(),
		);

		if (!match || !match.syncedLyrics || match.syncedLyrics?.length <= 0)
			return null;

		return {
			source: "lrclib.net",
			lineSynced: match?.syncedLyrics,
		};
	} catch (e) {
		return null;
	}
}

async function fetchLyricsMusixmatch(metadata: Metadata) {
	if (!metadata) return null;

	const tokenData = await getMusixmatchUsertoken();

	if (!tokenData) return null;

	const trackData = await _searchLyricsMusixmatch(metadata, tokenData);

	if (
		!trackData ||
		!trackData.hasLineSyncedLyrics ||
		(!trackData.commonTrackId && !trackData.trackId)
	)
		return null;

	const lyrics = await _fetchLyricsMusixmatch(
		metadata,
		tokenData,
		trackData.trackId,
		trackData.commonTrackId,
		trackData.hasLineSyncedLyrics,
	);

	return {
		source: "Musixmatch",
		lineSynced: lyrics,
	};
}

async function fetchLyricsNetease(metadata: Metadata) {
	if (!metadata) return null;

	const trackId = await _searchLyricsNetease(metadata);

	if (!trackId) return null;

	const lyrics = await _fetchLyricsNetease(metadata, trackId);

	return {
		source: "Netease",
		lineSynced: lyrics,
	};
}

async function _getLyrics(metadata: Metadata) {
	const avaibleSources = {
		musixmatch: fetchLyricsMusixmatch,
		lrclib: fetchLyricsLrclib,
		netease: fetchLyricsNetease,
	};

	const sources: (keyof typeof avaibleSources)[] = [
		"musixmatch",
		"lrclib",
		"netease",
	];

	for (const source of sources) {
		const lyrics = await avaibleSources[source](metadata);

		if (!lyrics) continue;

		if (lyrics?.lineSynced)
			return {
				source: lyrics.source,
				lineSynced: lyrics.lineSynced,
			};
	}
}

// async function getLyrics(
//     metadata: Metadata,
// ): Promise<LyricsOutput | null> {
//     if (
//         !metadata?.track &&
//         !metadata?.artist &&
//         !metadata?.album &&
//         !metadata?.trackId
//     ) return null;

//     if (metadata.trackId === currentSong.get().trackId) return currentSong.get();

//     const lyrics = await _getLyrics(metadata)

//     if (!lyrics) return null;

//     return {
//         artist: metadata.artist,
//         track: metadata.track,
//         album: metadata.album,
//         trackId: metadata.trackId || "_unknown",
//         lyrics,
//     }
// }

function parseLyrics(
	lyrics: string | null | undefined,
): FormattedLyric[] | null {
	const lyricsSplit = lyrics?.split("\n");

	if (!lyricsSplit) return null;

	const formattedLyrics: Array<FormattedLyric> = [];
	let lastTime: number;

	for (const index in lyricsSplit) {
		const lyricText = lyricsSplit[index].split(" ");

		// @ts-ignore
		const time = lyricText.shift().replace(/[\[\]]/g, "");
		const text = lyricText.join(" ");

		const minutes = time.split(":")[0];
		const seconds = time.split(":")[1];

		const totalSeconds =
			Number.parseFloat(minutes) * 60 + Number.parseFloat(seconds);

		const instrumentalLyricIndicator = " ";

		if (index === "0" && totalSeconds > 3 && instrumentalLyricIndicator) {
			formattedLyrics.push({
				time: 0,
				text: instrumentalLyricIndicator,
			});
		}

		if (text.length > 0) {
			lastTime = totalSeconds;

			formattedLyrics.push({
				time: totalSeconds,
				text: text,
			});
		}
        
		if (
            instrumentalLyricIndicator &&
            // @ts-ignore
			(!lastTime || totalSeconds - lastTime > 3)
		) {
			lastTime = totalSeconds;

			formattedLyrics.push({
				time: totalSeconds,
				text: instrumentalLyricIndicator,
			});
		}
	}

	return formattedLyrics;
}

function normalize(string: string): string {
	return string
		.replace(/（/g, "(")
		.replace(/）/g, ")")
		.replace(/【/g, "[")
		.replace(/】/g, "]")
		.replace(/。/g, ". ")
		.replace(/；/g, "; ")
		.replace(/：/g, ": ")
		.replace(/？/g, "? ")
		.replace(/！/g, "! ")
		.replace(/、|，/g, ", ")
		.replace(/‘|’|′|＇/g, "'")
		.replace(/“|”/g, '"')
		.replace(/〜/g, "~")
		.replace(/·|・/g, "•")
		.replace(/\s+/g, " ")
		.trim();
}

const spotify = Mpris.Player.new("spotify");

spotify.connect("notify::trackid", async (source) => {
	const metadata: Metadata = {
		album: source.album,
		artist: source.artist,
		length: source.length,
		track: source.title,
		trackId: source.trackid,
	};

	if (metadata.trackId === currentSong.get().trackId) return;

	const lyrics = await _getLyrics(metadata);

	if (!lyrics) return;

	const formattedLyrics = parseLyrics(lyrics.lineSynced);

	setCurrentSong({
		album: metadata.album || "Unknown Album",
		artist: metadata.artist || "Unknown Artist",
		cover: source.artUrl,
		length: metadata.length || 0,
		lyrics: formattedLyrics ?? undefined,
		source: lyrics.source,
		track: metadata.track || "Unknown Track",
		trackId: metadata.trackId || "_unknown",
	});
});
