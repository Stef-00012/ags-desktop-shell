import { escapeMarkup, marquee } from "@/util/text";
import { defaultConfig } from "@/constants/config";
import type { SongData } from "@/types/lyrics";
import { fileExists } from "@/util/file";
import { execAsync } from "ags/process";
import { config } from "@/util/config";
import { writeFile } from "ags/file";
import { Gdk, Gtk } from "ags/gtk4";
import Mpris from "gi://AstalMpris";
import Gio from "gi://Gio";
import {
	convertToLrc,
	formatLyricsTooltip,
	parseLyricsData,
	useSong,
} from "@/util/lyrics";
import {
	createBinding,
	createComputed,
	createRoot,
	jsx,
	type Accessor,
} from "ags";

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
	const available = createBinding(spotify, "available");

	const mainMetadata = createComputed([
		track,
		artist,
		album,
		volume,
		position,
		available
	]);

	const lyricsState = createComputed([song, position]);

	const coverVisibleState = createComputed([coverArt, available], transformCoverVisible)

	function transformCoverVisible(coverArt: string, available: boolean) {
		return available && !!coverArt && fileExists(coverArt);
	}

	function transformMediaLabel([track, artist,,,, isAvailable]: [
		string,
		string,
		string,
		number,
		number,
		boolean,
	]) {
		if (!track || !artist || !isAvailable) return "No Media Playing";

		return `${marquee(`${artist} - ${track}`, config.get()?.mediaMaxLength ?? defaultConfig.mediaMaxLength)}`;
	}

	function transformMediaTooltip([track, artist, album, volume,, isAvailable]: [
		string,
		string,
		string,
		number,
		number,
		boolean,
	]) {
		if (!track || !artist || !album || !isAvailable) return "";

		return [
			`Artist: ${escapeMarkup(artist)}`,
			`Track: ${escapeMarkup(track)}`,
			`Album: ${escapeMarkup(album)}`,
			`Volume: ${Math.round(volume * 100)}%`,
		].join("\n");
	}

	function transformMediaHasTooltip([track, artist, album,,, isAvailable]: [
		string,
		string,
		string,
		number,
		number,
		boolean,
	]) {
		if (!track || !artist || !album || !isAvailable) return false;

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

	function transformMediaIcon([track, artist,,,, isAvailable]: [
		string,
		string,
		string,
		number,
		number,
		boolean,
	]) {
		if (!track || !artist || !isAvailable) return "mi-music-off-symbolic";

		return "mi-music-note-symbolic";
	}

	function handleIconLeftClick() {
		const cover = coverArt.get();

		if (!cover || !fileExists(cover)) return;

		execAsync(`xdg-open "${cover}"`);
	}

	function handleIconMiddleClick() {
		const cover = coverArt.get();

		if (!cover || !fileExists(cover) || !spotify.available) return;

		if (
			!fileExists(
				config.get().paths?.saveFolder ??
					defaultConfig.paths.saveFolder,
				true,
			)
		)
			Gio.File.new_for_path(
				config.get().paths?.saveFolder ??
					defaultConfig.paths.saveFolder,
			).make_directory_with_parents(null);

		const destFile = Gio.File.new_for_path(
			`${config.get().paths?.saveFolder ?? defaultConfig.paths.saveFolder}/${spotify.trackid?.split("/").pop()}.png`,
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
		if (!spotify.available) return;

		if (deltaY < 0) {
			spotify.set_volume(
				spotify.volume +
					(config.get().volumeStep?.media ??
						defaultConfig.volumeStep.media),
			);
		} else if (deltaY > 0) {
			spotify?.set_volume(
				spotify.volume -
					(config.get().volumeStep?.media ??
						defaultConfig.volumeStep.media),
			);
		}
	}

	function handleMediaLeftClick() {
		if (!spotify.available) return;

		spotify.play_pause();
	}

	function handleMediaRightClick() {
		if (!spotify.available) return;

		execAsync(`wl-copy ${spotify.trackid.split("/").pop()}`);
		execAsync(
			`notify-send "Stef Shell Media" "The track ID of the song has been copied"`,
		);
	}

	function handleMediaMiddleClick() {
		if (!spotify.available) return;

		spotify.raise();
	}

	function handleLyricsLeftClick() {
		const songData = song.get();

		if (!songData) return;

		const lyrics = convertToLrc(songData);

		if (!lyrics) return;

		const path = `/tmp/lyrics.lrc`;

		if (fileExists(path)) {
			Gio.File.new_for_path(path).delete(null);
		}

		writeFile(path, lyrics);

		execAsync(`xdg-open "${path}"`);
	}

	function handleLyricsMiddleClick() {
		const songData = song.get();

		if (!songData) return;

		const lyrics = convertToLrc(songData);

		if (!lyrics) return;

		const path = `${config.get().paths?.saveFolder ?? defaultConfig.paths.saveFolder}/${songData.trackId.split("/").pop()}.lrc`;

		if (
			!fileExists(
				config.get().paths?.saveFolder ??
					defaultConfig.paths.saveFolder,
				true,
			)
		)
			Gio.File.new_for_path(
				config.get().paths?.saveFolder ??
					defaultConfig.paths.saveFolder,
			).make_directory_with_parents(null);

		if (fileExists(path)) {
			Gio.File.new_for_path(path).delete(null);
		}

		writeFile(path, lyrics);

		execAsync(`xdg-open "${path}"`);
	}

	return (
		<box class={className}>
			<box cursor={Gdk.Cursor.new_from_name("pointer", null)}>
				<image
					class={coverClass}
					valign={Gtk.Align.CENTER}
					visible={coverVisibleState}
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
				cursor={available((isAvailable) =>
					isAvailable
						? Gdk.Cursor.new_from_name("pointer", null)
						: Gdk.Cursor.new_from_name("default", null),
				)}
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
					button={Gdk.BUTTON_SECONDARY}
					onPressed={handleMediaRightClick}
				/>

				<Gtk.GestureClick
					button={Gdk.BUTTON_MIDDLE}
					onPressed={handleMediaMiddleClick}
				/>
			</box>

			<box
				class={lyricsClass}
				cursor={lyricsState(([songData]) =>
					songData?.lyrics
						? Gdk.Cursor.new_from_name("pointer", null)
						: Gdk.Cursor.new_from_name("default", null),
				)}
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
