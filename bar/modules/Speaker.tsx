import { createBinding, createComputed, createState, type Accessor } from "ags";
import { SPEAKER_VOLUME_STEP } from "@/constants/config";
import { Gtk } from "ags/gtk4";
import Wp from "gi://AstalWp";

interface Props {
	class?: string | Accessor<string>;
}

export default function Speaker({ class: className }: Props) {
	const wp = Wp.get_default();
	const speaker = wp?.audio.defaultSpeaker;

	if (!wp || !speaker)
		return (
			<box class={className}>
				<label label="Inaccessible Speaker" />
			</box>
		);

	const volume = createBinding(speaker, "volume");
	const iconName = createBinding(speaker, "volume_icon");
	const device = createBinding(speaker, "description");

	const [isBluetooth, setIsBluetooth] = createState(
		speaker.get_pw_property("device.api") === "bluez5",
	);

	const icon = createComputed([iconName, volume], transformIcon);

	device.subscribe(() => {
		setIsBluetooth(speaker.get_pw_property("device.api") === "bluez5");
	});

	function transformLabel(volume: number) {
		return `${Math.round(volume * 100)}%`;
	}

	function transformTooltip(device: string) {
		return `Device: ${device}`;
	}

	function transformIcon(iconName: string, volume: number) {
		if (volume === 0) return "audio-volume-muted-symbolic";
		else if (Math.round(volume * 100) === 100)
			return "audio-volume-high-symbolic";
		return iconName;
	}

	function handleScroll(
		_event: Gtk.EventControllerScroll,
		_deltaX: number,
		deltaY: number,
	) {
		if (deltaY < 0)
			speaker?.set_volume(
				Math.min(speaker.volume + SPEAKER_VOLUME_STEP, 1.5),
			);
		else if (deltaY > 0)
			speaker?.set_volume(
				Math.max(speaker.volume - SPEAKER_VOLUME_STEP, 0),
			);
	}

	return (
		<box class={className} tooltipMarkup={device(transformTooltip)}>
			<Gtk.EventControllerScroll
				flags={Gtk.EventControllerScrollFlags.VERTICAL}
				onScroll={handleScroll}
			/>

			<image
				iconName="mi-bluetooth-connected-symbolic"
				visible={isBluetooth}
				pixelSize={18}
				class="speaker-bluetooth-icon"
			/>

			<image iconName={icon} class="speaker-icon" />

			<label label={volume(transformLabel)} />
		</box>
	);
}
