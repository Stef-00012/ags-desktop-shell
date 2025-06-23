import { audioIcons } from "@/constants/icons";
import type { MicrophoneStat } from "@/types/systemStats";
import { getMicrohponeIcon } from "@/util/icons";
import { microphoneStat } from "@/util/systemStats";
import { Gtk } from "ags/gtk4";
import Wp from "gi://AstalWp";
import type { Accessor } from "ags";

interface Props {
	class?: string | Accessor<string>;
}

const VOLUME_STEP = 0.05; // 5%

export default function Microphone({ class: className }: Props) {
	function transformLabel(stat: MicrophoneStat) {
		return `${
			stat.isBluetooth ? `${audioIcons.bluetooth} ` : ""
		}${getMicrohponeIcon(stat.muted)} ${stat.volume}%`;
	}

	function transformTooltip(stat: MicrophoneStat) {
		return `Volume: ${stat.volume}%\nDevice: ${stat.name}`;
	}

	function handleScroll(
		event: Gtk.EventControllerScroll,
		deltaX: number,
		deltaY: number,
	) {
		const wp = Wp.get_default();
		const microphone = wp?.audio.defaultMicrophone;

		if (deltaY < 0) {
			microphone?.set_volume(Math.min(microphone.volume + VOLUME_STEP, 1.5));
		} else if (deltaY > 0) {
			microphone?.set_volume(Math.max(microphone.volume - VOLUME_STEP, 0));
		}
	}

	return (
		<box class={className}>
			<Gtk.EventControllerScroll
				flags={Gtk.EventControllerScrollFlags.VERTICAL}
				onScroll={handleScroll}
			/>

			<label
				label={microphoneStat(transformLabel)}
				tooltipMarkup={microphoneStat(transformTooltip)}
			/>
		</box>
	);
}
