import { createState, type Accessor, type Setter } from "ags";
import { Astal, Gdk, Gtk } from "ags/gtk4";
import Adw from "gi://Adw";
import AppMode from "./modes/app/App";
import CalculatorMode from "./modes/calculator/Calculator";
// import ClipboardMode from "./modes/clipboard/Clipboard";

export type LauncherMode = "closed" | "calculator" | "app" | "clipboard";
export interface PressedKey {
	keyval: number;
	modifier: number;
}

interface Props {
	gdkmonitor: Gdk.Monitor;
	mode: Accessor<LauncherMode>;
	setMode: Setter<LauncherMode>;
}

export default function Launcher({ gdkmonitor, mode, setMode }: Props) {
	const [searchValue, setSearchValue] = createState<string | null>(null);
	const [pressedKey, setPressedKey] = createState<PressedKey | null>(null);

	let entry: Gtk.Entry | null = null;

	mode.subscribe(() => {
		if (mode.get() !== "closed" && entry) entry.grab_focus();
	});

	const [enterPressed, setEnterPressed] = createState(false);
	const [externalClickPressed, setExternalClickPressed] = createState(false);

	const maxWidth = gdkmonitor.geometry.width * 0.5;
	const maxHeight = gdkmonitor.geometry.height * 0.5;

	function close() {
		setMode("closed");
		setSearchValue(null);

		if (entry) entry.set_text("")
	}

	function handleExternalClick() {
		console.log("external click");

		setExternalClickPressed(true);
		setExternalClickPressed(false);
	}

	function handleKeyPress(
		_e: Gtk.EventControllerKey,
		keyval: number,
		_keycode: number,
		modifier: number,
	) {
		setPressedKey({
			keyval,
			modifier,
		});
	}

	function handleInputChange() {
		if (!entry) return;

		const text = entry.get_text();

		setSearchValue(text.length > 0 ? text : null);
	}

	function handleInputEnter() {
		setEnterPressed(true);
		setEnterPressed(false);
	}

	return (
		<window
			class="launcher"
			visible={mode((currentMode) => currentMode !== "closed")}
			gdkmonitor={gdkmonitor} // maybe remove this so it only appears on the focused monitor
			fullscreened
			keymode={Astal.Keymode.EXCLUSIVE}
			anchor={
				Astal.WindowAnchor.BOTTOM |
				Astal.WindowAnchor.RIGHT |
				Astal.WindowAnchor.LEFT |
				Astal.WindowAnchor.TOP
			}
		>
			<Gtk.EventControllerKey onKeyPressed={handleKeyPress} />

			<Gtk.GestureClick
				button={Gdk.BUTTON_PRIMARY}
				onPressed={handleExternalClick}
				propagationPhase={Gtk.PropagationPhase.TARGET}
			/>

			<Adw.Clamp maximumSize={maxWidth}>
				<Adw.Clamp
					maximumSize={maxHeight}
					orientation={Gtk.Orientation.VERTICAL}
				>
					<box
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
								<AppMode
									close={close}
									searchValue={searchValue}
									enterPressed={enterPressed}
									pressedKey={pressedKey}
									visible={mode(
										(currentMode) => currentMode === "app",
									)}
									externalClickPressed={externalClickPressed}
								/>

								<CalculatorMode
									close={close}
									searchValue={searchValue}
									setSearchValue={setSearchValue}
									enterPressed={enterPressed}
									pressedKey={pressedKey}
									visible={mode(
										(currentMode) =>
											currentMode === "calculator",
									)}
									externalClickPressed={externalClickPressed}
								/>

								{/* <ClipboardMode
									close={close}
									searchValue={searchValue}
									enterPressed={enterPressed}
									pressedKey={pressedKey}
									visible={mode(
										(currentMode) =>
											currentMode === "clipboard",
									)}
									externalClickPressed={externalClickPressed}
								/> */}
							</box>
						</scrolledwindow>
					</box>
				</Adw.Clamp>
			</Adw.Clamp>
		</window>
	);
}
