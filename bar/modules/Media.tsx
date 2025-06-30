import {
	convertToLrc,
	formatLyricsTooltip,
	parseLyricsData,
	useSong,
} from "@/util/lyrics";
import {
	MEDIA_VOLUME_STEP,
	MEDIA_MAX_LENGTH,
	SAVE_FOLDER,
} from "@/constants/config";
import { escapeMarkup, marquee } from "@/util/text";
import type { SongData } from "@/types/lyrics";
import { fileExists } from "@/util/file";
import { Gdk, Gtk } from "ags/gtk4";
import Mpris from "gi://AstalMpris";
import {
	createBinding,
	createComputed,
	createRoot,
	jsx,
	type Accessor,
} from "ags";
import Gio from "gi://Gio?version=2.0";
import { execAsync } from "ags/process";

interface Props {
	class?: string | Accessor<string>;
	mediaClass?: string | Accessor<string>;
	lyricsClass?: string | Accessor<string>;
	coverClass?: string | Accessor<string>;
}

export default function Media({
	class: className,
	mediaClass,
	lyricsClass,
	coverClass,
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
	const coverArt = createBinding(spotify, "cover_art");

	const mainMetadata = createComputed([
		track,
		artist,
		album,
		volume,
		position,
	]);

	const lyricsState = createComputed([song, position]);

	function transformMediaLabel([track, artist]: [
		string,
		string,
		string,
		number,
		number,
	]) {
		if (!track || !artist) return "No Media Playing";

		return `${marquee(`${artist} - ${track}`, MEDIA_MAX_LENGTH)}`;
	}

	function transformMediaTooltip([track, artist, album, volume]: [
		string,
		string,
		string,
		number,
		number,
	]) {
		if (!track || !artist || !album) return "";

		return [
			`Artist: ${escapeMarkup(artist)}`,
			`Track: ${escapeMarkup(track)}`,
			`Album: ${escapeMarkup(album)}`,
			`Volume: ${Math.round(volume * 100)}%`,
		].join("\n");
	}

	function transformMediaHasTooltip([track, artist, album]: [
		string,
		string,
		string,
		number,
		number,
	]) {
		if (!track || !artist || !album) return false;

		return true;
	}

	function transformLyricsLabel([song, position]: [SongData | null, number]) {
		const noMediaMsg = "No Lyrics Available";

		if (!song || !song.lyrics || !song.source) return noMediaMsg;

		const parsedLyrics = parseLyricsData(
			song.lyrics,
			position,
			song.source,
		)?.current;

		if (!parsedLyrics) return noMediaMsg;

		return `${parsedLyrics}`;
	}

	function transformLyricsTooltip([song, position]: [
		SongData | null,
		number,
	]) {
		if (!song || !song.lyrics || !song.source) return "";

		const lyricsData = parseLyricsData(song.lyrics, position, song.source);

		if (!lyricsData) return "";

		return formatLyricsTooltip(song, lyricsData);
	}

	function transformLyricsHasTooltip([song, position]: [
		SongData | null,
		number,
	]) {
		if (!song || !song.lyrics || !song.source) return false;

		const lyricsData = parseLyricsData(song.lyrics, position, song.source);

		if (!lyricsData) return false;

		return true;
	}

	function transformMediaIcon([track, artist]: [
		string,
		string,
		string,
		number,
		number,
	]) {
		if (!track || !artist) return "mi-music-off-symbolic";

		return "mi-music-note-symbolic";
	}

	function handleIconLeftClick() {
		const cover = coverArt.get();

		if (!cover || !fileExists(cover)) return;

		execAsync(`xdg-open "${cover}"`);
	}

	function handleIconMiddleClick() {
		const cover = coverArt.get();

		if (!cover || !fileExists(cover)) return;

		if (!fileExists(SAVE_FOLDER, true))
			Gio.File.new_for_path(SAVE_FOLDER).make_directory_with_parents(
				null,
			);

		const destFile = Gio.File.new_for_path(
			`${SAVE_FOLDER}/${spotify.trackid.split("/").pop()}.png`,
		);
		Gio.File.new_for_path(cover).copy(
			destFile,
			Gio.FileCopyFlags.OVERWRITE,
			null,
			null,
		);
	}

	function handleMediaScroll(
		_event: Gtk.EventControllerScroll,
		_deltaX: number,
		deltaY: number,
	) {
		if (deltaY < 0) {
			spotify.set_volume(Math.min(spotify.volume + MEDIA_VOLUME_STEP, 1));
		} else if (deltaY > 0) {
			spotify?.set_volume(
				Math.max(spotify.volume - MEDIA_VOLUME_STEP, 0),
			);
		}
	}

	function handleMediaLeftClick() {
		spotify.play_pause();
	}

	function handleMediaMiddleClick() {
		spotify.raise();
	}

	function handleLyricsLeftClick() {
		const songData = song.get();

		if (!songData) return;

		const lyrics = convertToLrc(songData);

		if (!lyrics) return;

		const path = `/tmp/lyrics.lrc`;

		Gio.File.new_for_path(path)
			.create(Gio.FileCreateFlags.REPLACE_DESTINATION, null)
			.write(lyrics, null);

		execAsync(`xdg-open "${path}"`);
	}

	function handleLyricsMiddleClick() {
		const songData = song.get();

		if (!songData) return;

		const lyrics = convertToLrc(songData);

		if (!lyrics) return;

		const path = `${SAVE_FOLDER}/${songData.trackId.split("/").pop()}.lrc`;

		if (!fileExists(SAVE_FOLDER, true))
			Gio.File.new_for_path(SAVE_FOLDER).make_directory_with_parents(
				null,
			);

		Gio.File.new_for_path(path)
			.create(Gio.FileCreateFlags.REPLACE_DESTINATION, null)
			.write(lyrics, null);

		execAsync(`xdg-open "${path}"`);
	}

	return (
		<box class={className}>
			<box cursor={Gdk.Cursor.new_from_name("pointer", null)}>
				<image
					class={coverClass}
					valign={Gtk.Align.CENTER}
					visible={coverArt((path) => !!path && fileExists(path))}
					file={coverArt}
					overflow={Gtk.Overflow.HIDDEN}
				/>

				<Gtk.GestureClick
					button={Gdk.BUTTON_PRIMARY}
					onPressed={handleIconLeftClick}
				/>

				<Gtk.GestureClick
					button={Gdk.BUTTON_MIDDLE}
					onPressed={handleIconMiddleClick}
				/>
			</box>

			<box
				class={mediaClass}
				cursor={Gdk.Cursor.new_from_name("pointer", null)}
				hasTooltip={mainMetadata(transformMediaHasTooltip)}
				onQueryTooltip={(_label, _x, _y, _keyboardMode, tooltip) => {
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
				<image
					iconName={mainMetadata(transformMediaIcon)}
					class="media-icon"
				/>

				<label label={mainMetadata(transformMediaLabel)} />

				<Gtk.EventControllerScroll
					flags={Gtk.EventControllerScrollFlags.VERTICAL}
					onScroll={handleMediaScroll}
				/>

				<Gtk.GestureClick
					button={Gdk.BUTTON_PRIMARY}
					onPressed={handleMediaLeftClick}
				/>

				<Gtk.GestureClick
					button={Gdk.BUTTON_MIDDLE}
					onPressed={handleMediaMiddleClick}
				/>
			</box>

			<box
				class={lyricsClass}
				cursor={Gdk.Cursor.new_from_name("pointer", null)}
				hasTooltip={lyricsState(transformLyricsHasTooltip)}
				onQueryTooltip={(_label, _x, _y, _keyboardMode, tooltip) => {
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
			>
				<image iconName="mi-lyrics-symbolic" class="lyrics-icon" />

				<label label={lyricsState(transformLyricsLabel)} />

				<Gtk.GestureClick
					button={Gdk.BUTTON_PRIMARY}
					onPressed={handleLyricsLeftClick}
				/>

				<Gtk.GestureClick
					button={Gdk.BUTTON_MIDDLE}
					onPressed={handleLyricsMiddleClick}
				/>
			</box>
		</box>
	);
}
