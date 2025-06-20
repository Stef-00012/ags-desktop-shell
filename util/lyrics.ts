// import { fetch, Headers, URL } from "ags/fetch";
import { fetch, Headers, URL, URLSearchParams } from "@/util/fetch";
import type { Metadata, MusixmatchSearchResult, TokenData, UsertokenResponse } from "@/types/lyrics";
import { readFile, writeFile } from "ags/file";
import Soup from "gi://Soup?version=3.0";
import { timeout } from "ags/time";


const MUSIXMATCH_TOKEN_PATH = "/tmp/musixmatch_token.json";

const sleep = (ms: number) => new Promise((resolve) => timeout(ms, () => resolve(null)));

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

	const url = new URL("https://apic-desktop.musixmatch.com/ws/1.1/token.get?user_language=en&app_id=web-desktop-app-v1.0");

    try {
        const headers = new Headers()

        if (cookies) headers.append("cookie", cookies)
        
        const res = await fetch(url, {
            headers,
            flags: Soup.MessageFlags.NO_REDIRECT
        });

        if (res.status === 301) {
            const setCookie = res.headers.getAll("Set-Cookie")
                .map(cookie => cookie.split(";").shift())
                .join("; ")

            return await getMusixmatchUsertoken(setCookie)
        }

        if (!res.ok) return null;

        const data = await res.json() as UsertokenResponse;

        if (
            !data.message.body ||
            (data.message.header.status_code === 401 &&
            data.message.header.hint === "captcha")
        ) {
            await sleep(10000);

            return await getMusixmatchUsertoken(cookies)
        }

        const usertoken = data.message.body.user_token

        if (!usertoken) return null;

        const json: TokenData = {
            cookies,
            usertoken,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000).getTime() // 10 minutes
        }

        saveMusixmatchToken(json)

        return json
    } catch(e) {
        return null;
    }
}

export async function _searchLyricsMusixmatch(
    metadata: Metadata,
    tokenData: TokenData
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
    })

    const url = new URL(`https://apic-desktop.musixmatch.com/ws/1.1/track.search?${searchParams}`)

    try {
        const res = await fetch(url, {
            headers: {
                cookie: tokenData.cookies || "",
            }
        })

        if (!res.ok) return null;

        const data = await res.json();

        if (
            data?.message?.header?.status_code === 401 &&
            data?.message?.header?.hint === "captcha"
        ) return null;

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

        if (!hasLineSyncedLyrics)
            return null;

        return {
            hasLineSyncedLyrics,
            commonTrackId,
            trackId,
        };
    } catch(e) {
        return null;
    }
}