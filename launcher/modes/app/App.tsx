import { createState, For, type Accessor } from "ags";
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
}

export default function AppMode({
	close,
	searchValue,
	enterPressed,
	pressedKey,
	visible,
	closed,
}: Props) {
	const apps = new Apps.Apps({
		nameMultiplier: 2,
		entryMultiplier: 0,
		executableMultiplier: 2,
	});

	closed.subscribe(() => {
		if (!closed.get() || !visible.get()) return;

		close();
		setAppList(apps.get_list());
	});

	enterPressed.subscribe(() => {
		if (!enterPressed.get() || !visible.get()) return;

		const list = appList.get();

		if (list.length <= 0) {
			close();
			setAppList(apps.get_list());
			return;
		}

		list[0].launch();
	});

	pressedKey.subscribe(() => {
		if (!visible.get()) return;

		const keyData = pressedKey.get();

		if (!keyData) return;

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
		}
	});

	const [appList, setAppList] = createState<Apps.Application[]>(
		apps.get_list(),
	);

	searchValue.subscribe(() => {
		if (!visible.get()) return;

		setAppList(apps.fuzzy_query(searchValue.get()));
	});

	return (
		<box
			orientation={Gtk.Orientation.VERTICAL}
			visible={visible}
			class="apps-container"
		>
			<For each={appList}>
				{(app) => (
					<App
						app={app}
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
