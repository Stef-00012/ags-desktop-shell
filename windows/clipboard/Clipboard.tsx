import { defaultConfig } from "@/constants/config";
import {
    clipboardEntries,
    type ClipboardEntry,
    copyClipboardEntry,
    fuzzySearch,
    updateClipboardEntries,
} from "@/util/clipboard";
import { config } from "@/util/config";
import { sleep } from "@/util/timer";
import {
    type Accessor,
    createEffect,
    createState,
    For,
    type Setter,
} from "ags";
import { Gdk, Gtk } from "ags/gtk4";
import Adw from "gi://Adw";

interface Props {
	gdkmonitor: Gdk.Monitor;
	visible: Accessor<boolean>;
	setVisible: Setter<boolean>;
}

export default function Clipboard({
	gdkmonitor,
	visible: isVisible,
	setVisible,
}: Props) {
	updateClipboardEntries();

	const [filteredClipboard, setFilteredClipboard] = createState<
		ClipboardEntry[]
	>(clipboardEntries.peek());

	const [searchValue, setSearchValue] = createState<string | null>(null);

	let entry: Gtk.Entry | null = null;

	createEffect(() => {
		if (isVisible() && entry) entry.grab_focus();
	});

	createEffect(() => {
		const value = searchValue();

		if (value) {
			const clipboardData = clipboardEntries();

			if (!value) setFilteredClipboard(clipboardData);
			else {
				const filtered = fuzzySearch(clipboardData, value);

				setFilteredClipboard(filtered);
			}
		}
	});

	const maxWidth = gdkmonitor.geometry.width * 0.5;
	const maxHeight = gdkmonitor.geometry.height * 0.5;

	function close() {
		setSearchValue(null);
		setVisible(false);

		if (entry) entry.set_text("");
	}

	function handleKeyPress(
		_e: Gtk.EventControllerKey,
		keyval: number,
		_keycode: number,
		_modifier: number,
	) {
		if (keyval === Gdk.KEY_Escape) {
			close();
		}
	}

	function handleInputChange() {
		if (!entry) return;

		const text = entry.get_text();

		setSearchValue(text.length > 0 ? text : null);
	}

	function handleInputEnter() {
		const clipboarData = filteredClipboard.peek();

		if (clipboarData.length <= 0) close();
		else {
			const entry = clipboarData[0];

			copyClipboardEntry(entry);

			close();
		}
	}

	return (
		<Gtk.Window
			class="launcher"
			title="AGS Clipboard Launcher"
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
										class="clipboard-container"
									>
										<For each={filteredClipboard}>
											{(clipboardEntry) => (
												<box>
													<Gtk.GestureClick
														button={
															Gdk.BUTTON_PRIMARY
														}
														onPressed={() =>
															copyClipboardEntry(
																clipboardEntry,
															)
														}
													/>

													<label
														halign={Gtk.Align.START}
														label={
															clipboardEntry.value
														}
													/>
												</box>
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
