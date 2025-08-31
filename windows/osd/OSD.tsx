import { type Accessor, createComputed, createState } from "ags";
import { monitorFile, readFileAsync } from "ags/file";
import { defaultConfig } from "@/constants/config";
import { type Gdk, Gtk } from "ags/gtk4";
import type AstalIO from "gi://AstalIO";
import { config } from "@/util/config";
import { sleep } from "@/util/timer";
import { timeout } from "ags/time";
import giCairo from "gi://cairo";
import Wp from "gi://AstalWp";
import GLib from "gi://GLib";

interface Props {
	gdkmonitor: Gdk.Monitor;
	hidden: Accessor<boolean>;
}

export default function OSD({ gdkmonitor, hidden }: Props) {
	const wp = Wp.get_default();

	const maxWidth = gdkmonitor.geometry.width * 0.125;
	const maxHeight = gdkmonitor.geometry.height * 0.04;
	const marginTop = gdkmonitor.geometry.height * 0.6;

	const defaultSpeaker = wp?.audio.defaultSpeaker;
	const defaultMicrophone = wp?.audio.defaultMicrophone;

	const [isVisible, setIsVisible] = createState(false);
	const visibleState = createComputed(
		[isVisible, hidden],
		transformVisibleState,
	);

	let lastTimeout: AstalIO.Time;
	let isStartup = true;

	timeout(300, () => {
		isStartup = false;
	});

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

	const dir = GLib.Dir.open(
		config.get().paths?.backlightBaseDir ??
			defaultConfig.paths.backlightBaseDir,
		0,
	);
	const backlightDirName = dir.read_name();

	if (backlightDirName) {
		const backlightCurrentPath = `${config.get().paths?.backlightBaseDir ?? defaultConfig.paths.backlightBaseDir}/${backlightDirName}/brightness`;
		const backlightMaxPath = `${config.get().paths?.backlightBaseDir ?? defaultConfig.paths.backlightBaseDir}/${backlightDirName}/max_brightness`;

		monitorFile(backlightCurrentPath, async () => {
			const [currentString, maxString] = await Promise.all([
				readFileAsync(backlightCurrentPath),
				readFileAsync(backlightMaxPath),
			]);

			if (isStartup) return;

			setOsdState({
				type: "brightness",
				percentage: parseInt(currentString) / parseInt(maxString),
				mute: false,
				icon: "display-brightness-symbolic",
			});

			setIsVisible(true);

			if (lastTimeout) lastTimeout.cancel();
			lastTimeout = timeout(
				config.get().timeouts?.osd ?? defaultConfig.timeouts.osd,
				() => {
					setIsVisible(false);
				},
			);
		});
	}

	function transformVisibleState(isVisible: boolean, hidden: boolean) {
		return isVisible && !hidden;
	}

	function updateSpeakerState(speaker: Wp.Endpoint) {
		if (isStartup) return;

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
		lastTimeout = timeout(
			config.get().timeouts?.osd ?? defaultConfig.timeouts.osd,
			() => {
				setIsVisible(false);
			},
		);
	}

	function updateMicrophoneState(microphone: Wp.Endpoint) {
		if (isStartup) return;

		let icon = microphone.volumeIcon;

		if (microphone.volume === 0)
			icon = "microphone-sensitivity-muted-symbolic";

		setOsdState({
			type: "microphone",
			percentage: microphone.volume,
			mute: microphone.mute,
			icon: icon,
		});

		setIsVisible(true);

		if (lastTimeout) lastTimeout.cancel();
		lastTimeout = timeout(
			config.get().timeouts?.osd ?? defaultConfig.timeouts.osd,
			() => {
				setIsVisible(false);
			},
		);
	}

	return (
		<window
			gdkmonitor={gdkmonitor}
			class="osd"
			title="AGS OSD"
			css={`margin-top: ${marginTop}px;`}
			$={(self) => {
				self.get_surface()?.set_input_region(new giCairo.Region());

				self.connect("map", () => {
					self.get_surface()?.set_input_region(new giCairo.Region());
				});

				const revealer = self.child as Gtk.Revealer;
				const transitionDuration = revealer.get_transition_duration();

				visibleState.subscribe(async () => {
					const visible = visibleState.get();

					if (!visible) {
						revealer.set_reveal_child(visible);

						await sleep(transitionDuration);
					}

					self.set_visible(visible);

					if (visible) {
						revealer.set_reveal_child(visible);
					}
				});
			}}
		>
			<revealer
				transitionDuration={config(
					(cfg) =>
						cfg.animationsDuration?.osd ??
						defaultConfig.animationsDuration.osd,
				)}
				transitionType={config(
					(cfg) =>
						Gtk.RevealerTransitionType[
							cfg.animationsType?.osd ??
								defaultConfig.animationsType.osd
						],
				)}
			>
				<box
					heightRequest={maxHeight}
					widthRequest={maxWidth}
					class="osd-container"
				>
					<image
						iconName={osdState((state) => state.icon)}
						class="icon"
					/>

					<Gtk.ProgressBar
						hexpand
						valign={Gtk.Align.CENTER}
						class={osdState((state) =>
							Math.round(state.percentage * 100) > 100
								? "progress overfilled"
								: "progress",
						)}
						fraction={osdState((state) => state.percentage)}
					/>

					<label
						label={osdState(
							(state) => `${Math.round(state.percentage * 100)}%`,
						)}
					/>
				</box>
			</revealer>
		</window>
	);
}
