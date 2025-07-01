import { exec } from "ags/process";
import type { PressedKey } from "../../Launcher";
import { Gdk, Gtk } from "ags/gtk4";
import { createState, For, type Accessor } from "ags";

interface Props {
	close: () => void;
	searchValue: Accessor<string | null>;
	enterPressed: Accessor<boolean>;
	pressedKey: Accessor<PressedKey | null>;
	visible: Accessor<boolean>;
}

export default function ClipboardMode({
	close,
	searchValue,
	enterPressed,
	pressedKey,
	visible,
}: Props) {
	const [clipboard, setClipboard] = createState<string[]>([]);
	const [filteredClipboard, setFilteredClipboard] = createState<string[]>([]);

	visible.subscribe(() => {
		if (!visible.get()) return;

		const clipboardData = exec("cliphist list");
		const data = clipboardData
			.split("\n")
			.filter((line) => line.trim() !== "");

		setClipboard(data);
		setFilteredClipboard(data);
	});

	pressedKey.subscribe(() => {
		if (!visible.get()) return;

		const keyData = pressedKey.get();

		if (!keyData) return;

		if (keyData.keyval === Gdk.KEY_Escape) {
			close();

			return;
		}
	});

	enterPressed.subscribe(() => {
		if (!enterPressed.get() || !visible.get()) return;

		const clipboarData = clipboard.get();

		if (clipboarData.length <= 0) return close();

		const text = clipboarData[0];

		copyText(text);
	});

	searchValue.subscribe(() => {
		if (!visible.get()) return;

		const value = searchValue.get();
		if (!value) return setFilteredClipboard(clipboard.get());

		const clipboardData = clipboard.get();

		const filtered = fuzzySearch(clipboardData, value);

		setFilteredClipboard(filtered);
	});

	function fuzzySearch(arr: string[], query: string): string[] {
		return arr.filter((e) => {
			e = e.toLowerCase();
			query = query.toLowerCase();

			let i = 0,
				lastSearched = -1,
				current = query[i];

			while (current) {
                lastSearched = e.indexOf(current, lastSearched + 1)
				
                if (lastSearched === -1) {
					return false;
				}

				current = query[++i];
			}

			return true;
		});
	}

	function copyText(text: string) {
		const id = parseInt(text);

		exec(`cliphist decode ${id} | wl-copy`);
	}

	return (
		<box
			orientation={Gtk.Orientation.VERTICAL}
			visible={visible}
			class="clipboard-container"
		>
			<For each={filteredClipboard}>
				{(clipboardEntry) => (
					<box>
                        <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={() => copyText(clipboardEntry)} />

                        <label halign={Gtk.Align.START} label={clipboardEntry} />
                    </box>
				)}
			</For>
		</box>
	);
}
