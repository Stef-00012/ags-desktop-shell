import { createBinding, createComputed, createState, type Accessor } from "ags";
import { defaultConfig } from "@/constants/config";
import { config } from "@/util/config";
import { Gtk } from "ags/gtk4";
import Wp from "gi://AstalWp";

interface Props {
	class?: string | Accessor<string>;
}

export default function Microphone({ class: className }: Props) {
	const wp = Wp.get_default();
	const microphone = wp?.audio.defaultMicrophone;

	if (!wp || !microphone)
		return (
			<box class={className}>
				<label label="Inaccessible Microphone" />
			</box>
		);

	const volume = createBinding(microphone, "volume");
	const iconName = createBinding(microphone, "volume_icon");
	const device = createBinding(microphone, "description");

	const [isBluetooth, setIsBluetooth] = createState(
		microphone.get_pw_property("device.api") === "bluez5",
	);

	const icon = createComputed([iconName, volume], transformIcon);

	device.subscribe(() => {
		setIsBluetooth(microphone.get_pw_property("device.api") === "bluez5");
	});

	function transformLabel(volume: number) {
		return `${Math.round(volume * 100)}%`;
	}

	function transformTooltip(device: string) {
		return `Device: ${device}`;
	}

	function transformIcon(iconName: string, volume: number) {
		if (volume === 0) return "microphone-sensitivity-muted-symbolic";
		return iconName;
	}

	function handleScroll(
		_event: Gtk.EventControllerScroll,
		_deltaX: number,
		deltaY: number,
	) {
		const wp = Wp.get_default();
		const microphone = wp?.audio.defaultMicrophone;

		if (deltaY < 0) {
			microphone?.set_volume(
				microphone.volume +
					(config.get().volumeStep?.microphone ??
						defaultConfig.volumeStep.microphone),
			);
		} else if (deltaY > 0) {
			microphone?.set_volume(
				microphone.volume -
					(config.get().volumeStep?.microphone ??
						defaultConfig.volumeStep.microphone),
			);
		}
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
				class="microphone-bluetooth-icon"
			/>

			<image iconName={icon} class="microphone-icon" />

			<label label={volume(transformLabel)} />
		</box>
	);
}
