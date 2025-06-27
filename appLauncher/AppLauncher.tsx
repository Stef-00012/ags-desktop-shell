import { createState, For, type Accessor, type Setter } from "ags";
import { Astal, Gdk, Gtk } from "ags/gtk4";
import App from "./components/App";
import Apps from "gi://AstalApps";
import Adw from "gi://Adw";

interface Props {
	gdkmonitor: Gdk.Monitor;
	visible: Accessor<boolean>;
	setVisible: Setter<boolean>;
}

export default function AppLauncher({
	gdkmonitor,
	visible,
	setVisible,
}: Props) {
	const apps = new Apps.Apps({
		nameMultiplier: 2,
		entryMultiplier: 0,
		executableMultiplier: 2,
	});

	const [searchValue, setSearchValue] = createState<string | null>(null);
	const [appList, setAppList] = createState<Apps.Application[]>(
		apps.get_list(),
	);

	let entry: Gtk.Entry | null = null;

	visible.subscribe(() => {
		if (visible.get() && entry) entry.grab_focus();
	});

	searchValue.subscribe(() => {
		setAppList(apps.fuzzy_query(searchValue.get()));
	});

	const maxWidth = gdkmonitor.geometry.width * 0.5;
	const maxHeight = gdkmonitor.geometry.height * 0.5;

	function close() {
		setVisible(false);
		setSearchValue(null);
	}

	function handleExternalClick() {
		close();
	}

	function handleEscKey(
		_e: Gtk.EventControllerKey,
		keyval: number,
		_: number,
		_mod: number,
	) {
		if (keyval === Gdk.KEY_Escape) close();
	}

	function handleInputChange() {
		if (!entry) return;

		const text = entry.get_text();

		setSearchValue(text.length > 0 ? text : null);
	}

	function handleInputEnter() {
		const apps = appList.get();

		if (apps.length <= 0) return close();

		apps[0].launch();
		close();
	}

	return (
		<window
			class="app-launcher"
			visible={visible}
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
			<Gtk.EventControllerKey onKeyPressed={handleEscKey} />

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
						class="applauncher-container"
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
								<For each={appList}>
									{(app) => (
										<App
											app={app}
											onOpen={() => {
												app.launch();
												close();
											}}
										/>
									)}
								</For>
							</box>
						</scrolledwindow>
					</box>
				</Adw.Clamp>
			</Adw.Clamp>
		</window>
	);
}
