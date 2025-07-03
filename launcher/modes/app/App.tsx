import { createComputed, createState, For, type Accessor } from "ags";
import type { PressedKey } from "../../Launcher";
import { Gdk, Gtk } from "ags/gtk4";
import App from "./components/App";
import Apps from "gi://AstalApps";

interface Props {
	close: () => void;
	searchValue: Accessor<string | null>;
	enterPressed: Accessor<boolean>;
	pressedKey: Accessor<PressedKey | null>;
	visible: Accessor<boolean>;
	closed: Accessor<boolean>;
	entry: Gtk.Entry | null;
}

export default function AppMode({
	close,
	searchValue,
	enterPressed,
	pressedKey,
	visible,
	closed,
	entry
}: Props) {
	const apps = new Apps.Apps({
		nameMultiplier: 2,
		entryMultiplier: 0,
		executableMultiplier: 2,
	});

	const [focusedApp, setFocusedApp] = createState(0)

	closed.subscribe(() => {
		if (!closed.get() || !visible.get()) return;

		close();
		setAppList(apps.get_list());
	});

	enterPressed.subscribe(() => {
		if (!enterPressed.get() || !visible.get()) return;

		handleInputEnter()
	});

	pressedKey.subscribe(() => {
		if (!visible.get()) return;

		const keyData = pressedKey.get();

		if (!keyData) return;

		if ((keyData.keyval === Gdk.KEY_Down || keyData.keyval === Gdk.KEY_Tab) && appList.get().length > focusedApp.get()) {
			setFocusedApp((prev) => prev + 1);
			return;
		}

		if (keyData.keyval === Gdk.KEY_Up || keyData.keyval === Gdk.KEY_ISO_Left_Tab) {
			if (focusedApp.get() > 0) setFocusedApp((prev) => prev - 1);
			return;
		}

		if (keyData.keyval === Gdk.KEY_Escape) {
			close();
			setAppList(apps.get_list());
			return;
		}

		const isAlt = keyData.modifier & Gdk.ModifierType.ALT_MASK;

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

		if (isAlt && numberKeys.includes(keyData.keyval)) {
			const index = numberKeys.indexOf(keyData.keyval);

			if (index === -1 || index >= appList.get().length) {
				close();
				setAppList(apps.get_list());
				return;
			}

			appList.get()[index].launch();
			close();
			setAppList(apps.get_list());
			return;
		}

		if (keyData.keyval === Gdk.KEY_Return) {
			handleInputEnter();
			return;
		}

		if (keyData.keyval === Gdk.KEY_BackSpace && entry) {
			const text = entry.text;

			if (text.length > 0) {
				const pos = entry.get_position();
				if (pos > 0) {
					const newText = entry.text.slice(0, pos - 1) + entry.text.slice(pos);
					entry.set_text(newText);
					entry.grab_focus()
					entry.set_position(pos - 1);
				}
			}

			return;
		}

		if (keyData.keyval === Gdk.KEY_Delete && entry) {
			const text = entry.text;

			if (text.length > 0) {
				const pos = entry.get_position();
				if (pos > 0) {
					const newText = entry.text.slice(0, pos) + entry.text.slice(pos + 1);
					entry.set_text(newText);
					entry.grab_focus()
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
			Gdk.KEY_KbdInputAssistCancel
		]

		console.log(keyData.keyval)

		if (!keyData.modifier && entry && !entry.hasFocus) {
			entry.grab_focus();

			if (!invalidKeys.includes(keyData.keyval)) {
				entry.set_text(entry.text + String.fromCharCode(keyData.keyval));
				entry.set_position(entry.text.length);
			}

			return;
		}
	});

	const [appList, setAppList] = createState<Apps.Application[]>(
		apps.get_list(),
	);

	searchValue.subscribe(() => {
		if (!visible.get()) return;

		setAppList(apps.fuzzy_query(searchValue.get()));
		setFocusedApp(0)
	});

	function handleInputEnter() {
		const list = appList.get();
		const appIndex = focusedApp.get();

		if (list.length <= appIndex) {
			close();
			setAppList(apps.get_list());
			return;
		}

		list[appIndex].launch();
		close()
		setAppList(apps.get_list());
	}

	return (
		<box
			orientation={Gtk.Orientation.VERTICAL}
			visible={visible}
			class="apps-container"
		>
			<For each={appList}>
				{(app, index) => (
					<App
						app={app}
						focused={createComputed([focusedApp, index], (focusedApp, index) => focusedApp === index)}
						onOpen={() => {
							app.launch();
							close();
							setAppList(apps.get_list());
						}}
					/>
				)}
			</For>
		</box>
	);
}
