import { defaultConfig } from "@/constants/config";
import type { Config } from "@/types/config";
import type { Accessor, Setter } from "ags";
import { execAsync } from "ags/process";
import { config } from "@/util/config";
import { barHeight } from "@/windows/bar/Bar";
import { sleep } from "@/util/timer";
import { Gdk, Gtk } from "ags/gtk4";
import Pango from "gi://Pango";
import Adw from "gi://Adw";

interface Props {
	gdkmonitor: Gdk.Monitor;
	visible: Accessor<boolean>;
	setVisible: Setter<boolean>;
}

export default function SessionMenu({
	gdkmonitor,
	visible: isVisible,
	setVisible,
}: Props) {
	function handleExternalClick() {
		setVisible(false);
	}

	function handleEscKey(
		_e: Gtk.EventControllerKey,
		keyval: number,
		_: number,
		_mod: number,
	) {
		if (keyval === Gdk.KEY_Escape) setVisible(false);
	}

	function transformConfigHeight(cfg: Config) {
		return (
			(cfg.sessionMenu?.buttonHeight ??
				defaultConfig.sessionMenu.buttonHeight) *
				2 +
			(cfg.sessionMenu?.buttonGap ?? defaultConfig.sessionMenu.buttonGap)
		);
	}

	function transformConfigWidth(cfg: Config) {
		return (
			(cfg.sessionMenu?.buttonWidth ??
				defaultConfig.sessionMenu.buttonWidth) *
				4 +
			(cfg.sessionMenu?.buttonGap ??
				defaultConfig.sessionMenu.buttonGap) *
				3
		);
	}

	return (
		<Gtk.Window
			widthRequest={gdkmonitor.geometry.width}
			heightRequest={gdkmonitor.geometry.height}
			resizable={false}
			class="session-menu"
			title="AGS Session Menu"
			display={gdkmonitor.display}
			onCloseRequest={() => {
				setVisible(false);
			}}
			$={(self) => {
				const revealer = self.child as Gtk.Revealer;
				const transitionDuration = revealer.get_transition_duration();

				isVisible.subscribe(async () => {
					const classes = self.cssClasses;
					const visible = isVisible.get();

					if (!visible) {
						revealer.set_reveal_child(visible);
						self.set_css_classes(
							classes.filter((className) => className !== "open"),
						);

						await sleep(transitionDuration);
					}

					self.set_visible(visible);

					if (visible) {
						revealer.set_reveal_child(visible);
						self.set_css_classes([...classes, "open"]);
					}
				});
			}}
		>
			<Gtk.EventControllerKey onKeyPressed={handleEscKey} />

			<revealer
				transitionDuration={config(
					(cfg) =>
						cfg.animationsDuration?.sessionMenu ??
						defaultConfig.animationsDuration.sessionMenu,
				)}
				transitionType={config(
					(cfg) =>
						Gtk.RevealerTransitionType[
							cfg.animationsType?.sessionMenu ??
								defaultConfig.animationsType.sessionMenu
						],
				)}
			>
				<Gtk.GestureClick
					button={Gdk.BUTTON_PRIMARY}
					onPressed={handleExternalClick}
					propagationPhase={Gtk.PropagationPhase.TARGET}
				/>

				<Adw.Clamp
					orientation={Gtk.Orientation.VERTICAL}
					maximumSize={config(transformConfigHeight)}
					marginTop={barHeight}
				>
					<Adw.Clamp
						maximumSize={config(transformConfigWidth)}
						hexpand
						vexpand
					>
						<box
							orientation={Gtk.Orientation.VERTICAL}
							spacing={config(
								(cfg) =>
									cfg.sessionMenu?.buttonGap ??
									defaultConfig.sessionMenu.buttonGap,
							)}
						>
							<box
								spacing={config(
									(cfg) =>
										cfg.sessionMenu?.buttonGap ??
										defaultConfig.sessionMenu.buttonGap,
								)}
							>
								<button
									cursor={Gdk.Cursor.new_from_name(
										"pointer",
										null,
									)}
									widthRequest={config(
										(cfg) =>
											cfg.sessionMenu?.buttonWidth ??
											defaultConfig.sessionMenu
												.buttonWidth,
									)}
									heightRequest={config(
										(cfg) =>
											cfg.sessionMenu?.buttonHeight ??
											defaultConfig.sessionMenu
												.buttonHeight,
									)}
									onClicked={() => {
										execAsync("loginctl lock-session");
										setVisible(false);
									}}
								>
									<box
										orientation={Gtk.Orientation.VERTICAL}
										valign={Gtk.Align.CENTER}
									>
										<image
											pixelSize={60}
											iconName="mi-lock-symbolic"
										/>

										<label
											wrapMode={Pango.WrapMode.WORD}
											justify={Gtk.Justification.CENTER}
											label="Lock"
										/>
									</box>
								</button>

								<button
									cursor={Gdk.Cursor.new_from_name(
										"pointer",
										null,
									)}
									widthRequest={config(
										(cfg) =>
											cfg.sessionMenu?.buttonWidth ??
											defaultConfig.sessionMenu
												.buttonWidth,
									)}
									heightRequest={config(
										(cfg) =>
											cfg.sessionMenu?.buttonHeight ??
											defaultConfig.sessionMenu
												.buttonHeight,
									)}
									onClicked={() => {
										execAsync("systemctl suspend");
										setVisible(false);
									}}
								>
									<box
										orientation={Gtk.Orientation.VERTICAL}
										valign={Gtk.Align.CENTER}
									>
										<image
											pixelSize={60}
											iconName="mi-dark-mode-symbolic"
										/>

										<label
											wrapMode={Pango.WrapMode.WORD}
											justify={Gtk.Justification.CENTER}
											label="Sleep"
										/>
									</box>
								</button>

								<button
									cursor={Gdk.Cursor.new_from_name(
										"pointer",
										null,
									)}
									widthRequest={config(
										(cfg) =>
											cfg.sessionMenu?.buttonWidth ??
											defaultConfig.sessionMenu
												.buttonWidth,
									)}
									heightRequest={config(
										(cfg) =>
											cfg.sessionMenu?.buttonHeight ??
											defaultConfig.sessionMenu
												.buttonHeight,
									)}
									onClicked={() => {
										execAsync("pkill Hyprland");
									}}
								>
									<box
										orientation={Gtk.Orientation.VERTICAL}
										valign={Gtk.Align.CENTER}
									>
										<image
											pixelSize={60}
											iconName="mi-logout-symbolic"
										/>

										<label
											wrapMode={Pango.WrapMode.WORD}
											justify={Gtk.Justification.CENTER}
											label="Logout"
										/>
									</box>
								</button>

								<button
									cursor={Gdk.Cursor.new_from_name(
										"pointer",
										null,
									)}
									widthRequest={config(
										(cfg) =>
											cfg.sessionMenu?.buttonWidth ??
											defaultConfig.sessionMenu
												.buttonWidth,
									)}
									heightRequest={config(
										(cfg) =>
											cfg.sessionMenu?.buttonHeight ??
											defaultConfig.sessionMenu
												.buttonHeight,
									)}
									onClicked={() => {
										execAsync("kitty btop");
									}}
								>
									<box
										orientation={Gtk.Orientation.VERTICAL}
										valign={Gtk.Align.CENTER}
									>
										<image
											pixelSize={60}
											iconName="mi-browse-activity-symbolic"
										/>

										<label
											wrapMode={Pango.WrapMode.WORD}
											justify={Gtk.Justification.CENTER}
											label="Task Manager"
										/>
									</box>
								</button>
							</box>

							<box
								spacing={config(
									(cfg) =>
										cfg.sessionMenu?.buttonGap ??
										defaultConfig.sessionMenu.buttonGap,
								)}
							>
								<button
									cursor={Gdk.Cursor.new_from_name(
										"pointer",
										null,
									)}
									widthRequest={config(
										(cfg) =>
											cfg.sessionMenu?.buttonWidth ??
											defaultConfig.sessionMenu
												.buttonWidth,
									)}
									heightRequest={config(
										(cfg) =>
											cfg.sessionMenu?.buttonHeight ??
											defaultConfig.sessionMenu
												.buttonHeight,
									)}
									onClicked={() => {
										execAsync("systemctl hibernate");
									}}
								>
									<box
										orientation={Gtk.Orientation.VERTICAL}
										valign={Gtk.Align.CENTER}
									>
										<image
											pixelSize={60}
											iconName="mi-downloading-symbolic"
										/>

										<label
											wrapMode={Pango.WrapMode.WORD}
											justify={Gtk.Justification.CENTER}
											label="Hibernate"
										/>
									</box>
								</button>

								<button
									cursor={Gdk.Cursor.new_from_name(
										"pointer",
										null,
									)}
									widthRequest={config(
										(cfg) =>
											cfg.sessionMenu?.buttonWidth ??
											defaultConfig.sessionMenu
												.buttonWidth,
									)}
									heightRequest={config(
										(cfg) =>
											cfg.sessionMenu?.buttonHeight ??
											defaultConfig.sessionMenu
												.buttonHeight,
									)}
									onClicked={() => {
										execAsync("systemctl poweroff");
									}}
								>
									<box
										orientation={Gtk.Orientation.VERTICAL}
										valign={Gtk.Align.CENTER}
									>
										<image
											pixelSize={60}
											iconName="mi-power-settings-new-symbolic"
										/>

										<label
											wrapMode={Pango.WrapMode.WORD}
											justify={Gtk.Justification.CENTER}
											label="Shutdown"
										/>
									</box>
								</button>

								<button
									cursor={Gdk.Cursor.new_from_name(
										"pointer",
										null,
									)}
									widthRequest={config(
										(cfg) =>
											cfg.sessionMenu?.buttonWidth ??
											defaultConfig.sessionMenu
												.buttonWidth,
									)}
									heightRequest={config(
										(cfg) =>
											cfg.sessionMenu?.buttonHeight ??
											defaultConfig.sessionMenu
												.buttonHeight,
									)}
									onClicked={() => {
										execAsync("reboot");
									}}
								>
									<box
										orientation={Gtk.Orientation.VERTICAL}
										valign={Gtk.Align.CENTER}
									>
										<image
											pixelSize={60}
											iconName="mi-restart-alt-symbolic"
										/>

										<label
											wrapMode={Pango.WrapMode.WORD}
											justify={Gtk.Justification.CENTER}
											label="Reboot"
										/>
									</box>
								</button>

								<button
									cursor={Gdk.Cursor.new_from_name(
										"pointer",
										null,
									)}
									widthRequest={config(
										(cfg) =>
											cfg.sessionMenu?.buttonWidth ??
											defaultConfig.sessionMenu
												.buttonWidth,
									)}
									heightRequest={config(
										(cfg) =>
											cfg.sessionMenu?.buttonHeight ??
											defaultConfig.sessionMenu
												.buttonHeight,
									)}
									onClicked={() => {
										execAsync(
											"systemctl reboot --firmware-setup",
										);
									}}
								>
									<box
										orientation={Gtk.Orientation.VERTICAL}
										valign={Gtk.Align.CENTER}
									>
										<image
											pixelSize={60}
											iconName="mi-settings-applications-symbolic"
										/>

										<label
											wrap
											wrapMode={Pango.WrapMode.WORD}
											justify={Gtk.Justification.CENTER}
											label="UEFI"
										/>
									</box>
								</button>
							</box>
						</box>
					</Adw.Clamp>
				</Adw.Clamp>
			</revealer>
		</Gtk.Window>
	);
}
