import { audioIcons } from "@/constants/icons";
import type { SpeakerStat } from "@/types/systemStats";
import { getSpeakerIcon } from "@/util/icons";
import { speakerStat } from "@/util/systemStats";
import { Gtk } from "ags/gtk4";
import Wp from "gi://AstalWp";
import type { Accessor } from "ags";

interface Props {
	class?: string | Accessor<string>;
}

const VOLUME_STEP = 0.05; // 5%

export default function Speaker({ class: className }: Props) {
	function transformLabel(stat: SpeakerStat) {
		return `${
			stat.isBluetooth ? `${audioIcons.bluetooth} ` : ""
		}${getSpeakerIcon(stat.volume, stat.muted)} ${stat.volume}%`;
	}

	function transformTooltip(stat: SpeakerStat) {
		return `Volume: ${stat.volume}%\nDevice: ${stat.name}`;
	}

	function handleScroll(
		event: Gtk.EventControllerScroll,
		deltaX: number,
		deltaY: number,
	) {
		const wp = Wp.get_default();
		const speaker = wp?.audio.defaultSpeaker;

		if (deltaY < 0)
			speaker?.set_volume(Math.min(speaker.volume + VOLUME_STEP, 1.5));
		else if (deltaY > 0)
			speaker?.set_volume(Math.max(speaker.volume - VOLUME_STEP, 0));
	}

	return (
		<box class={className}>
			<Gtk.EventControllerScroll
				flags={Gtk.EventControllerScrollFlags.VERTICAL}
				onScroll={handleScroll}
			/>

			<label
				label={speakerStat(transformLabel)}
				tooltipMarkup={speakerStat(transformTooltip)}
			/>
		</box>
	);
}
