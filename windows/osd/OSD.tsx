import { defaultConfig } from "@/constants/config";
import { config } from "@/util/config";
import { OSDState, OSDVisibleState } from "@/util/osd";
import { sleep } from "@/util/timer";
import { createEffect } from "ags";
import { type Gdk, Gtk } from "ags/gtk4";
import giCairo from "gi://cairo";

interface Props {
	gdkmonitor: Gdk.Monitor;
}

export default function OSD({ gdkmonitor }: Props) {
	const maxWidth = gdkmonitor.geometry.width * 0.125;
	const maxHeight = gdkmonitor.geometry.height * 0.04;
	const marginTop = gdkmonitor.geometry.height * 0.6;

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

				createEffect(async () => {
					const visible = OSDVisibleState();

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
						iconName={OSDState((state) => state.icon)}
						class="icon"
					/>

					<Gtk.ProgressBar
						hexpand
						valign={Gtk.Align.CENTER}
						class={OSDState((state) =>
							Math.round(state.percentage * 100) > 100
								? "progress overfilled"
								: "progress",
						)}
						fraction={OSDState((state) => state.percentage)}
					/>

					<label
						label={OSDState(
							(state) => `${Math.round(state.percentage * 100)}%`,
						)}
					/>
				</box>
			</revealer>
		</window>
	);
}
