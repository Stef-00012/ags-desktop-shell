import { setIsMediaPlayerVisible } from "@/app";
import { defaultConfig } from "@/constants/config";
import type { SongData } from "@/types/lyrics";
import { config } from "@/util/config";
import { fileExists } from "@/util/file";
import {
	convertToLrc,
	formatLyricsTooltip,
	parseLyricsData,
	useSong,
} from "@/util/lyrics";
import { escapeTextForPango, marquee } from "@/util/text";
import {
	type Accessor,
	createBinding,
	createComputed,
	createRoot,
	jsx,
	With,
} from "ags";
import { writeFile } from "ags/file";
import { Gdk, Gtk } from "ags/gtk4";
import { execAsync } from "ags/process";
import Adw from "gi://Adw?version=1";
import Mpris from "gi://AstalMpris";
import Gio from "gi://Gio";

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

	const mainMetadata: Accessor<
		[string, string, string, number, number, boolean]
	> = createComputed(() => [
		track(),
		artist(),
		album(),
		volume(),
		position(),
		available(),
	]);

	const lyricsState: Accessor<[SongData | null, number]> = createComputed(
		() => [song(), position()],
	);

	const coverVisibleState = createComputed(() =>
		transformCoverVisible(coverArt(), available()),
	);

	function transformCoverVisible(coverArt: string, available: boolean) {
		return available && !!coverArt && fileExists(coverArt);
	}

	function transformMediaLabel([track, artist, , , , isAvailable]: [
		string,
		string,
		string,
		number,
		number,
		boolean,
	]) {
		if (!track || !artist || !isAvailable) return "No Media Playing";

		return `${marquee(`${artist} - ${track}`, config.peek()?.mediaMaxLength ?? defaultConfig.mediaMaxLength)}`;
	}

	function transformMediaTooltip([
		track,
		artist,
		album,
		volume,
		,
		isAvailable,
	]: [string, string, string, number, number, boolean]) {
		if (!track || !artist || !album || !isAvailable) return "";

		return [
			`Artist: ${escapeTextForPango(artist)}`,
			`Track: ${escapeTextForPango(track)}`,
			`Album: ${escapeTextForPango(album)}`,
			`Volume: ${Math.round(volume * 100)}%`,
		].join("\n");
	}

	function transformMediaHasTooltip([track, artist, album, , , isAvailable]: [
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

	function transformMediaIcon([track, artist, , , , isAvailable]: [
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
		const cover = coverArt.peek();

		if (!cover || !fileExists(cover)) return;

		execAsync(`xdg-open "${cover}"`);
	}

	function handleIconMiddleClick() {
		const cover = coverArt.peek();

		if (!cover || !fileExists(cover) || !spotify.available) return;

		if (
			!fileExists(
				config.peek().paths?.saveFolder ??
					defaultConfig.paths.saveFolder,
				true,
			)
		)
			Gio.File.new_for_path(
				config.peek().paths?.saveFolder ??
					defaultConfig.paths.saveFolder,
			).make_directory_with_parents(null);

		const destFile = Gio.File.new_for_path(
			`${config.peek().paths?.saveFolder ?? defaultConfig.paths.saveFolder}/${spotify.trackid?.split("/").pop()}.png`,
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
					(config.peek().volumeStep?.media ??
						defaultConfig.volumeStep.media),
			);
		} else if (deltaY > 0) {
			spotify?.set_volume(
				spotify.volume -
					(config.peek().volumeStep?.media ??
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
		// if (!spotify.available) return;

		setIsMediaPlayerVisible((prev) => !prev);

		// spotify.raise();
	}

	function handleLyricsLeftClick() {
		const songData = song.peek();

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
		const songData = song.peek();

		if (!songData) return;

		const lyrics = convertToLrc(songData);

		if (!lyrics) return;

		const path = `${config.peek().paths?.saveFolder ?? defaultConfig.paths.saveFolder}/${songData.trackId.split("/").pop()}.lrc`;

		if (
			!fileExists(
				config.peek().paths?.saveFolder ??
					defaultConfig.paths.saveFolder,
				true,
			)
		)
			Gio.File.new_for_path(
				config.peek().paths?.saveFolder ??
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
				<box>
					<With value={coverArt}>
						{(value) => (
							<Adw.Clamp
								maximumSize={35}
								widthRequest={35}
								heightRequest={35}
							>
								<Gtk.Picture
									class={coverClass}
									valign={Gtk.Align.CENTER}
									visible={coverVisibleState}
									file={Gio.file_new_for_path(value)}
									overflow={Gtk.Overflow.HIDDEN}
								/>
							</Adw.Clamp>
						)}
					</With>
				</box>

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
