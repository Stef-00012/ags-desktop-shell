import { apps } from "@/app";
import { defaultConfig } from "@/constants/config";
import { config } from "@/util/config";
import { sleep } from "@/util/timer";
import {
	type Accessor,
	createComputed,
	createEffect,
	createState,
	For,
	type Setter,
} from "ags";
import { Gdk, Gtk } from "ags/gtk4";
import Adw from "gi://Adw";
import type Apps from "gi://AstalApps";
import App from "./components/App";
export interface PressedKey {
	keyval: number;
	modifier: number;
}

interface Props {
	gdkmonitor: Gdk.Monitor;
	visible: Accessor<boolean>;
	setVisible: Setter<boolean>;
}

export default function AppLauncher({
	gdkmonitor,
	visible: isVisible,
	setVisible,
}: Props) {
	const [focusedApp, setFocusedApp] = createState(0);

	const [appList, setAppList] = createState<Apps.Application[]>(
		apps.peek().get_list(),
	);

	const [searchValue, setSearchValue] = createState<string | null>(null);

	let entry: Gtk.Entry | null = null;

	createEffect(() => {
		if (isVisible() && entry) entry.grab_focus();
	});

	createEffect(() => {
		const value = searchValue();

		if (value) {
			setAppList(apps().fuzzy_query(value));
			setFocusedApp(0);
		}
	});

	createEffect(() => {
		if (!isVisible()) {
			close();
			setAppList(apps().get_list());
		}
	});

	const maxWidth = gdkmonitor.geometry.width * 0.5;
	const maxHeight = gdkmonitor.geometry.height * 0.5;

	function close() {
		setSearchValue(null);

		if (entry) entry.set_text("");

		setVisible(false);
		setFocusedApp(0);
	}

	function handleKeyPress(
		_e: Gtk.EventControllerKey,
		keyval: number,
		_keycode: number,
		modifier: number,
	) {
		if (
			(keyval === Gdk.KEY_Down || keyval === Gdk.KEY_Tab) &&
			appList.peek().length > focusedApp.peek()
		) {
			setFocusedApp((prev) => prev + 1);
			return;
		}

		if (keyval === Gdk.KEY_Up || keyval === Gdk.KEY_ISO_Left_Tab) {
			if (focusedApp.peek() > 0) setFocusedApp((prev) => prev - 1);
			return;
		}

		if (keyval === Gdk.KEY_Escape) {
			close();
			setAppList(apps.peek().get_list());
			return;
		}

		const isAlt = modifier & Gdk.ModifierType.ALT_MASK;

		const numberKeys = [
			Gdk.KEY_1,
			Gdk.KEY_2,
			Gdk.KEY_3,
			Gdk.KEY_4,
			Gdk.KEY_5,
			Gdk.KEY_6,
			Gdk.KEY_7,
			Gdk.KEY_8,
			Gdk.KEY_9,
			Gdk.KEY_0,
		];

		if (isAlt && numberKeys.includes(keyval)) {
			const index = numberKeys.indexOf(keyval);

			if (index === -1 || index >= appList.peek().length) {
				close();
				setAppList(apps.peek().get_list());
				return;
			}

			appList.peek()[index].launch();
			close();
			setAppList(apps.peek().get_list());
			return;
		}

		if (keyval === Gdk.KEY_Return) {
			handleInputEnter();
			return;
		}

		if (keyval === Gdk.KEY_BackSpace && entry) {
			const text = entry.text;

			if (text.length > 0) {
				const pos = entry.get_position();
				if (pos > 0) {
					const newText =
						entry.text.slice(0, pos - 1) + entry.text.slice(pos);

					entry.set_text(newText);
					entry.grab_focus();
					entry.set_position(pos - 1);
				}
			}

			return;
		}

		if (keyval === Gdk.KEY_Delete && entry) {
			const text = entry.text;

			if (text.length > 0) {
				const pos = entry.get_position();
				if (pos > 0) {
					const newText =
						entry.text.slice(0, pos) + entry.text.slice(pos + 1);

					entry.set_text(newText);
					entry.grab_focus();
					entry.set_position(pos);
				}
			}

			return;
		}

		const invalidKeys = [
			Gdk.KEY_Shift_L,
			Gdk.KEY_Shift_R,
			Gdk.KEY_Shift_Lock,
			Gdk.KEY_Alt_L,
			Gdk.KEY_Alt_R,
			Gdk.KEY_Control_L,
			Gdk.KEY_Control_R,
			Gdk.KEY_F1,
			Gdk.KEY_F2,
			Gdk.KEY_F3,
			Gdk.KEY_F4,
			Gdk.KEY_F5,
			Gdk.KEY_F6,
			Gdk.KEY_F7,
			Gdk.KEY_F8,
			Gdk.KEY_F9,
			Gdk.KEY_F10,
			Gdk.KEY_F11,
			Gdk.KEY_F12,
			Gdk.KEY_F13,
			Gdk.KEY_F14,
			Gdk.KEY_F15,
			Gdk.KEY_F16,
			Gdk.KEY_F17,
			Gdk.KEY_F18,
			Gdk.KEY_F19,
			Gdk.KEY_F20,
			Gdk.KEY_F21,
			Gdk.KEY_F22,
			Gdk.KEY_F23,
			Gdk.KEY_F24,
			Gdk.KEY_F25,
			Gdk.KEY_F26,
			Gdk.KEY_F27,
			Gdk.KEY_F28,
			Gdk.KEY_F29,
			Gdk.KEY_Cancel,
			Gdk.KEY_Num_Lock,
			Gdk.KEY_MediaRepeat,
			Gdk.KEY_AudioPlay,
			Gdk.KEY_3270_PrintScreen,
			Gdk.KEY_Left,
			Gdk.KEY_Right,
			Gdk.KEY_Up,
			Gdk.KEY_Down,
			Gdk.KEY_KP_0,
			Gdk.KEY_KP_1,
			Gdk.KEY_KP_2,
			Gdk.KEY_KP_3,
			Gdk.KEY_KP_4,
			Gdk.KEY_KP_5,
			Gdk.KEY_KP_6,
			Gdk.KEY_KP_7,
			Gdk.KEY_KP_8,
			Gdk.KEY_KP_9,
			Gdk.KEY_KP_Separator,
			Gdk.KEY_KP_Page_Up,
			Gdk.KEY_KP_Page_Down,
			Gdk.KEY_KP_End,
			Gdk.KEY_KP_Home,
			Gdk.KEY_KP_Left,
			Gdk.KEY_KP_Up,
			Gdk.KEY_KP_Right,
			Gdk.KEY_KP_Down,
			Gdk.KEY_KP_Insert,
			Gdk.KEY_KP_Delete,
			Gdk.KEY_KP_Begin,
			Gdk.KEY_Meta_L,
			Gdk.KEY_Meta_R,
			Gdk.KEY_Super_L,
			Gdk.KEY_Super_R,
			Gdk.KEY_KbdInputAssistCancel,
		];

		if (!modifier && entry && !entry.hasFocus) {
			entry.grab_focus();

			if (!invalidKeys.includes(keyval)) {
				entry.set_text(entry.text + String.fromCharCode(keyval));
				entry.set_position(entry.text.length);
			}

			return;
		}
	}

	function handleInputChange() {
		if (!entry) return;

		const text = entry.get_text();

		setSearchValue(text.length > 0 ? text : null);
	}

	function handleInputEnter() {
		const list = appList.peek();
		const appIndex = focusedApp.peek();

		if (list.length <= appIndex) {
			close();
			setAppList(apps.peek().get_list());
			return;
		}

		list[appIndex].launch();
		close();
		setAppList(apps.peek().get_list());
	}

	return (
		<Gtk.Window
			class="launcher"
			title="AGS App Launcher"
			display={gdkmonitor.display}
			resizable={false}
			onCloseRequest={() => {
				close();
			}}
			$={(self) => {
				const revealer = self.child as Gtk.Revealer;
				const transitionDuration = revealer.get_transition_duration();

				createEffect(async () => {
					const classes = self.cssClasses;
					const visible = isVisible();

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
			<Gtk.EventControllerKey onKeyPressed={handleKeyPress} />

			<revealer
				transitionDuration={config(
					(cfg) =>
						cfg.animationsDuration?.launcher ??
						defaultConfig.animationsDuration.launcher,
				)}
				transitionType={config(
					(cfg) =>
						Gtk.RevealerTransitionType[
							cfg.animationsType?.launcher ??
								defaultConfig.animationsType.launcher
						],
				)}
			>
				<Adw.Clamp
					orientation={Gtk.Orientation.VERTICAL}
					maximumSize={maxHeight}
				>
					<Adw.Clamp maximumSize={maxWidth}>
						<box
							widthRequest={maxWidth}
							heightRequest={maxHeight}
							class="launcher-container"
							orientation={Gtk.Orientation.VERTICAL}
						>
							<entry
								class="search-entry"
								onNotifyCursorPosition={handleInputChange}
								onActivate={handleInputEnter}
								$={(self) => {
									entry = self;
								}}
							/>

							<Gtk.Separator visible />

							<scrolledwindow
								propagateNaturalHeight
								propagateNaturalWidth
								hscrollbarPolicy={Gtk.PolicyType.NEVER}
							>
								<box orientation={Gtk.Orientation.VERTICAL}>
									<box
										orientation={Gtk.Orientation.VERTICAL}
										class="apps-container"
									>
										<For each={appList}>
											{(app, index) => (
												<App
													app={app}
													focused={createComputed(
														() =>
															focusedApp() ===
															index(),
													)}
													onOpen={() => {
														app.launch();
														close();
														setAppList(
															apps
																.peek()
																.get_list(),
														);
													}}
												/>
											)}
										</For>
									</box>
								</box>
							</scrolledwindow>
						</box>
					</Adw.Clamp>
				</Adw.Clamp>
			</revealer>
		</Gtk.Window>
	);
}
