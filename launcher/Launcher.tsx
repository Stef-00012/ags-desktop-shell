import { createState, type Accessor, type Setter } from "ags";
import CalculatorMode from "./modes/calculator/Calculator";
// import ClipboardMode from "./modes/clipboard/Clipboard";
import { type Gdk, Gtk } from "ags/gtk4";
import AppMode from "./modes/app/App";
import { barHeight } from "@/bar/Bar";
import Adw from "gi://Adw";

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
	const [closed, setClosed] = createState(false);

	let entry: Gtk.Entry | null = null;

	mode.subscribe(() => {
		if (mode.get() !== "closed" && entry) entry.grab_focus();
	});

	const [enterPressed, setEnterPressed] = createState(false);

	const maxWidth = gdkmonitor.geometry.width * 0.5;
	const maxHeight = gdkmonitor.geometry.height * 0.5;

	function close() {
		setMode("closed");
		setSearchValue(null);

		if (entry) entry.set_text("");
	}

	function emptySearch() {
		setSearchValue(null);

		if (entry) entry.set_text("");
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
		<Gtk.Window
			class="launcher"
			title="AGS Launcher"
			visible={mode((currentMode) => currentMode !== "closed")}
			display={gdkmonitor.display}
			onCloseRequest={() => {
				close();

				setClosed(true);
				setClosed(false);
			}}
		>
			<Gtk.EventControllerKey onKeyPressed={handleKeyPress} />

			<Adw.Clamp
				orientation={Gtk.Orientation.VERTICAL}
				maximumSize={maxHeight}
			>
				<Adw.Clamp maximumSize={maxWidth}>
					<box
						widthRequest={maxWidth}
						heightRequest={maxHeight}
						hexpand
						class="launcher-container"
						orientation={Gtk.Orientation.VERTICAL}
						marginTop={barHeight}
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
									closed={closed}
								/>

								<CalculatorMode
									close={close}
									searchValue={searchValue}
									emptySearch={emptySearch}
									enterPressed={enterPressed}
									pressedKey={pressedKey}
									visible={mode(
										(currentMode) =>
											currentMode === "calculator",
									)}
									closed={closed}
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
								/> */}
							</box>
						</scrolledwindow>
					</box>
				</Adw.Clamp>
			</Adw.Clamp>
		</Gtk.Window>
	);
}
