import { audioIcons } from "@/constants/icons";
import type { MicrophoneStat } from "@/types/systemStats";
import { getMicrohponeIcon } from "@/util/icons";
import { microphoneStat } from "@/util/systemStats";
import { Gtk } from "ags/gtk4";
import Wp from "gi://AstalWp";

const VOLUME_STEP = 0.05; // 5%

export default function Microphone() {
	function transformLabel(stat: MicrophoneStat) {
		return `${
			stat.isBluetooth ? `${audioIcons.bluetooth} ` : ""
		}${stat.volume}% ${getMicrohponeIcon(stat.muted)}`;
	}

	function transformTooltip(stat: MicrophoneStat) {
		return `Volume: ${stat.volume}%\nDevice: ${stat.name}`;
	}

	return (
		<box>
			<Gtk.EventControllerScroll
				flags={Gtk.EventControllerScrollFlags.VERTICAL}
				onScroll={(event, deltaX, deltaY) => {
					const wp = Wp.get_default();
					const microphone = wp?.audio.defaultMicrophone;

					if (deltaY < 0) {
						microphone?.set_volume(
							Math.min(microphone.volume + VOLUME_STEP, 1.5),
						);
					} else if (deltaY > 0) {
						microphone?.set_volume(
							Math.max(microphone.volume - VOLUME_STEP, 0),
						);
					}
				}}
			/>

			<label
				label={microphoneStat(transformLabel)}
				tooltipMarkup={microphoneStat(transformTooltip)}
			/>
		</box>
	);
}
