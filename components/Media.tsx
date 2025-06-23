import type { SongData } from "@/types/lyrics";
import {
	position,
	formatLyricsTooltip,
	parseLyricsData,
	useSong,
} from "@/util/lyrics";
import { centerText, colorText, marquee } from "@/util/text";
import { createComputed } from "ags";

export default function Media() {
	const song = useSong();

	function transformMediaLabel(song: SongData | null) {
		if (!song) return "No Media Playing";

		return marquee(`${song?.artist} - ${song?.track}`, 20);
	}

	function transformMediaTooltip(song: SongData | null) {
		if (!song) return "";

		return centerText(
			[
				colorText(`${song.artist} - ${song.track}`, "#abcdef"),
				`Volume: ${song.volume}%`,
			].join("\n"),
		);
	}

	function transformLyricsLabel([song, position]: [SongData | null, number]) {
		if (!song || !song.lyrics || !song.source) return "No Lyrics Available";

		return (
			parseLyricsData(song.lyrics, position, song.source)?.current ||
			"No Lyrics Available"
		);
	}

	function transformLyricsTooltip([song, position]: [SongData | null, number]) {
		if (!song || !song.lyrics || !song.source) return "";

		const lyricsData = parseLyricsData(song.lyrics, position, song.source);

		if (!lyricsData) return "";

		return formatLyricsTooltip(song, lyricsData);
	}

	const lyricsState = createComputed([song, position]);

	return (
		<box>
			<label
				label={song(transformMediaLabel)}
				tooltipMarkup={song(transformMediaTooltip)}
			/>

			<label
				label={lyricsState(transformLyricsLabel)}
				tooltipMarkup={lyricsState(transformLyricsTooltip)}
			/>
		</box>
	);
}
