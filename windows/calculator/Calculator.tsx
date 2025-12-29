import { defaultConfig } from "@/constants/config";
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
import { exec, execAsync } from "ags/process";
import Adw from "gi://Adw";

interface Props {
	gdkmonitor: Gdk.Monitor;
	visible: Accessor<boolean>;
	setVisible: Setter<boolean>;
}

export default function Calculator({
	gdkmonitor,
	visible: isVisible,
	setVisible,
}: Props) {
	const [searchValue, setSearchValue] = createState<string | null>(null);

	const [result, setResult] = createState<string | null>(null);
	const [history, setHistory] = createState<string[]>([]);

	let entry: Gtk.Entry | null = null;

	createEffect(() => {
		if (isVisible()) {
			execAsync("qalc -e '0 - 0'");

			if (entry) entry.grab_focus();
		}
	});

	createEffect(() => {
		const value = searchValue();

		if (value) {
			let res = "Invalid Input";

			try {
				res = exec(`qalc ${value}`);
			} catch (_e) {}

			setResult(res.trim());
		}
	});

	const maxWidth = gdkmonitor.geometry.width * 0.5;
	const maxHeight = gdkmonitor.geometry.height * 0.5;

	function close() {
		emptySearch();
		setVisible(false);
		setHistory([]);
		setResult(null);
	}

	function emptySearch() {
		setSearchValue(null);

		if (entry) entry.set_text("");
	}

	function handleKeyPress(
		_e: Gtk.EventControllerKey,
		keyval: number,
		_keycode: number,
		_modifier: number,
	) {
		if (keyval === Gdk.KEY_Escape) {
			setHistory([]);
			setResult(null);
			close();

			return;
		}
	}

	function handleInputChange() {
		if (!entry) return;

		const text = entry.get_text();

		setSearchValue(text.length > 0 ? text : null);
	}

	function handleInputEnter() {
		const res = result.peek();
		const historyData = history.peek();

		if (!res || historyData[0] === res) return emptySearch();

		setHistory((prev) => [res, ...prev]);
		emptySearch();
		setResult(null);
	}

	return (
		<Gtk.Window
			class="launcher"
			title="AGS Calculator Launcher"
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
										class="calculator-container"
									>
										<label
											label={result((res) => res || "")}
											halign={Gtk.Align.START}
											class="calculator-result"
										/>

										<Gtk.Separator
											visible
											class="calculator-separator"
										/>

										<For each={history}>
											{(historyEntry) => (
												<label
													halign={Gtk.Align.START}
													label={historyEntry}
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
