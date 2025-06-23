import type { SongData } from "@/types/lyrics";
import { formatLyricsTooltip, parseLyricsData, useSong } from "@/util/lyrics";
import Mpris from "gi://AstalMpris";
import { escapeMarkup, marquee } from "@/util/text";
import {
	createBinding,
	createComputed,
	createRoot,
	jsx,
	type Accessor,
} from "ags";
import { Gdk, Gtk } from "ags/gtk4";
import { getLyricsIcon, getMediaIcon } from "@/util/icons";

interface Props {
	class?: string | Accessor<string>;
	mediaClass?: string | Accessor<string>;
	lyricsClass?: string | Accessor<string>;
}

const VOLUME_STEP = 0.05; // 5%
const MEDIA_MAX_LENGTH = 25;

export default function Media({
	class: className,
	mediaClass,
	lyricsClass,
}: Props) {
	let mediaDispose: (() => void) | null = null;
	let lyricsDispose: (() => void) | null = null;

	const spotify = Mpris.Player.new("spotify");
	const song = useSong(spotify);

	const position = createBinding(spotify, "position");
	const volume = createBinding(spotify, "volume");
	const artist = createBinding(spotify, "artist");
	const track = createBinding(spotify, "title");
	const album = createBinding(spotify, "album");

	const mainMetadata = createComputed([track, artist, album, volume, position]);

	function transformMediaLabel([track, artist]: [
		string,
		string,
		string,
		number,
		number,
	]) {
		if (!song) return `${getMediaIcon(false)} No Media Playing`;

		return `${getMediaIcon(true)} ${marquee(`${artist} - ${track}`, MEDIA_MAX_LENGTH)}`;
	}

	function transformMediaTooltip([track, artist, album, volume]: [
		string,
		string,
		string,
		number,
		number,
	]) {
		if (!song) return "";

		return [
			`Artist: ${escapeMarkup(artist)}`,
			`Track: ${escapeMarkup(track)}`,
			`Album: ${escapeMarkup(album)}`,
			`Volume: ${Math.round(volume * 100)}%`,
		].join("\n");
	}

	function transformLyricsLabel([song, position]: [SongData | null, number]) {
		const noMediaMsg = `${getLyricsIcon(false)} No Lyrics Available`;

		if (!song || !song.lyrics || !song.source) return noMediaMsg;

		const parsedLyrics = parseLyricsData(
			song.lyrics,
			position,
			song.source,
		)?.current;

		if (!parsedLyrics) return noMediaMsg;

		return `${getLyricsIcon(true)} ${parsedLyrics}`;
	}

	function transformLyricsTooltip([song, position]: [SongData | null, number]) {
		if (!song || !song.lyrics || !song.source) return "";

		const lyricsData = parseLyricsData(song.lyrics, position, song.source);

		if (!lyricsData) return "";

		return formatLyricsTooltip(song, lyricsData);
	}

	const lyricsState = createComputed([song, position]);

	function handleScroll(
		event: Gtk.EventControllerScroll,
		deltaX: number,
		deltaY: number,
	) {
		if (deltaY < 0) {
			spotify.set_volume(Math.min(spotify.volume + VOLUME_STEP, 1));
		} else if (deltaY > 0) {
			spotify?.set_volume(Math.max(spotify.volume - VOLUME_STEP, 0));
		}
	}

	function handleLeftClick() {
		spotify.play_pause();
	}

	return (
		<box class={className}>
			<label
				cursor={Gdk.Cursor.new_from_name("pointer", null)}
				class={mediaClass}
				label={mainMetadata(transformMediaLabel)}
				hasTooltip
				onQueryTooltip={(label, x, y, k, tooltip) => {
					if (mediaDispose) mediaDispose();

					createRoot((dispose) => {
						mediaDispose = dispose;

						tooltip.set_custom(
							jsx(Gtk.Label, {
								justify: Gtk.Justification.CENTER,
								useMarkup: true,
								label: mainMetadata(transformMediaTooltip),
							}),
						);
					});

					return true;
				}}
			>
				<Gtk.EventControllerScroll
					flags={Gtk.EventControllerScrollFlags.VERTICAL}
					onScroll={handleScroll}
				/>

				<Gtk.GestureClick
					button={Gdk.BUTTON_PRIMARY}
					onPressed={handleLeftClick}
				/>
			</label>

			<label
				class={lyricsClass}
				label={lyricsState(transformLyricsLabel)}
				hasTooltip
				onQueryTooltip={(label, x, y, k, tooltip) => {
					if (lyricsDispose) lyricsDispose();

					createRoot((dispose) => {
						lyricsDispose = dispose;

						tooltip.set_custom(
							jsx(Gtk.Label, {
								justify: Gtk.Justification.CENTER,
								useMarkup: true,
								label: lyricsState(transformLyricsTooltip),
							}),
						);
					});

					return true;
				}}
			/>
		</box>
	);
}
