import type { SongData } from "@/types/lyrics";
import { currentSong, formatLyricsTooltip, parseLyricsData } from "@/util/lyrics";
import { centerText, colorText, marquee } from "@/util/text";

export default function Media() {
	function transformMediaLabel(song: SongData) {
		return marquee(`${song.artist} - ${song.track}`, 20);
	}

	function transformMediaTooltip(song: SongData) {
		return centerText(
			[colorText(`${song.artist} - ${song.track}`, "#abcdef"), `Volume: ${song.volume}%`].join("\n"),
		);
	}

	function transformLyricsLabel(song: SongData) {
		return parseLyricsData(song)?.current || "No Lyrics Available";
	}

	function transformLyricsTooltip(song: SongData) {
		const lyrics = parseLyricsData(song);
		if (!lyrics) return "";

		return formatLyricsTooltip(song, lyrics);
	}

	return (
		<box>
			<label
				label={currentSong(transformMediaLabel)}
				tooltipMarkup={currentSong(transformMediaTooltip)}
			/>

			<label
				label={currentSong(transformLyricsLabel)}
				tooltipMarkup={currentSong(transformLyricsTooltip)}
			/>
		</box>
	);
}
