import { type Gdk, Gtk } from "ags/gtk4";
import { createState } from "ags";
import Wp from "gi://AstalWp";
import GLib from "gi://GLib";
import { monitorFile, readFileAsync } from "ags/file";
import { timeout } from "ags/time";
import type AstalIO from "gi://AstalIO";
import giCairo from "gi://cairo";

interface Props {
	gdkmonitor: Gdk.Monitor;
}

const BACKLIGHT_BASE_DIR = "/sys/class/backlight";
const TIMEOUT_TIME = 3000; // 3 seconds

export default function OSD({ gdkmonitor }: Props) {
	const wp = Wp.get_default();

	const maxWidth = gdkmonitor.geometry.width * 0.125;
	const maxHeight = gdkmonitor.geometry.height * 0.04;
	const marginTop = gdkmonitor.geometry.height * 0.6;

	const defaultSpeaker = wp?.audio.defaultSpeaker;
	const defaultMicrophone = wp?.audio.defaultMicrophone;

	const [isVisible, setIsVisible] = createState(false);

	let lastTimeout: AstalIO.Time;

	const [osdState, setOsdState] = createState<{
		type: "speaker" | "microphone" | "brightness";
		percentage: number;
		mute: boolean;
		icon: string;
	}>({
		type: "speaker",
		percentage: defaultSpeaker?.volume || 0,
		mute: defaultSpeaker?.mute || true,
		icon: defaultSpeaker?.icon || "audio-volume-muted-symbolic",
	});

	defaultSpeaker?.connect("notify::volume", updateSpeakerState);
	defaultSpeaker?.connect("notify::mute", updateSpeakerState);

	defaultMicrophone?.connect("notify::volume", updateMicrophoneState);
	defaultMicrophone?.connect("notify::mute", updateMicrophoneState);

	const dir = GLib.Dir.open(BACKLIGHT_BASE_DIR, 0);
	const backlightDirName = dir.read_name();

	if (backlightDirName) {
		const backlightCurrentPath = `${BACKLIGHT_BASE_DIR}/${backlightDirName}/brightness`;
		const backlightMaxPath = `${BACKLIGHT_BASE_DIR}/${backlightDirName}/max_brightness`;

		monitorFile(backlightCurrentPath, async () => {
			const [currentString, maxString] = await Promise.all([
				readFileAsync(backlightCurrentPath),
				readFileAsync(backlightMaxPath),
			]);

			setOsdState({
				type: "brightness",
				percentage: parseInt(currentString) / parseInt(maxString),
				mute: false,
				icon: "display-brightness-symbolic",
			});

			setIsVisible(true);

			if (lastTimeout) lastTimeout.cancel();
			lastTimeout = timeout(TIMEOUT_TIME, () => {
				setIsVisible(false);
			});
		});
	}

    let osdContainer: Gtk.Box | null;
	let window: Gtk.Window | null;

    isVisible.subscribe(() => {
		timeout(100, () => {
			if (!window || !osdContainer) return;

			const [_success, bounds] =
				osdContainer.compute_bounds(window);

			const height = bounds.get_height();
			const width = bounds.get_width();
			const x = bounds.get_x();
			const y = bounds.get_y();

			// console.log({
			// 	x,
			// 	y,
			// 	height,
			// 	width,
			// })

			const surface = window.get_surface();

			const region = new giCairo.Region();

			// @ts-ignore
			region.unionRectangle(
				new giCairo.Rectangle({
					x,
					y,
					height,
					width,
				}),
			);

			surface?.set_input_region(region);
		});
	})

	function updateSpeakerState(speaker: Wp.Endpoint) {
		let icon = speaker.volumeIcon;

		if (speaker.volume === 0) icon = "audio-volume-muted-symbolic";
		else if (Math.round(speaker.volume * 100) === 100)
			icon = "audio-volume-high-symbolic";

		setOsdState({
			type: "speaker",
			percentage: speaker.volume,
			mute: speaker.mute,
			icon: icon,
		});

		setIsVisible(true);

		if (lastTimeout) lastTimeout.cancel();
		lastTimeout = timeout(TIMEOUT_TIME, () => {
			setIsVisible(false);
		});
	}

	function updateMicrophoneState(microphone: Wp.Endpoint) {
		let icon = microphone.volumeIcon;

		if (microphone.volume === 0) icon = "microphone-sensitivity-muted-symbolic";

		setOsdState({
			type: "microphone",
			percentage: microphone.volume,
			mute: microphone.mute,
			icon: icon,
		});

		// console.log(icon)

		setIsVisible(true);

		if (lastTimeout) lastTimeout.cancel();
		lastTimeout = timeout(TIMEOUT_TIME, () => {
			setIsVisible(false);
		});
	}

	return (
		<window
			gdkmonitor={gdkmonitor}
			visible={isVisible}
			class="osd"
			css={`margin-top: ${marginTop}px;`}
            $={(self) => {
                window = self;
            }}
		>
			<box
				heightRequest={maxHeight}
				widthRequest={maxWidth}
				class="osd-container"
                $={(self) => {
                    osdContainer = self;
                }}
			>
				<image iconName={osdState((state) => state.icon)} class="icon" />

				<Gtk.ProgressBar
					hexpand
					valign={Gtk.Align.CENTER}
					class={osdState((state) =>
						Math.round(state.percentage * 100) > 100 && !state.mute
							? "progress overfilled"
							: "progress",
					)}
					fraction={osdState((state) => state.percentage)}
				/>
			</box>
		</window>
	);
}
