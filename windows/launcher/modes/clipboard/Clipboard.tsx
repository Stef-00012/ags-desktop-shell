import {
	type ClipboardEntry,
	clipboardEntries,
	copyClipboardEntry,
	fuzzySearch,
	updateClipboardEntries,
} from "@/util/clipboard";
import { type Accessor, createState, For } from "ags";
import { Gdk, Gtk } from "ags/gtk4";
import type { PressedKey } from "../../Launcher";

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
	updateClipboardEntries();

	const [filteredClipboard, setFilteredClipboard] = createState<
		ClipboardEntry[]
	>(clipboardEntries.get());

	visible.subscribe(() => {
		if (!visible.get()) return;

		const value = searchValue.get();
		console.log(value, !value);
		if (!value) return setFilteredClipboard(clipboardEntries.get());
	});

	clipboardEntries.subscribe(() => {
		if (!visible.get()) return;

		const clipboardData = clipboardEntries.get();

		const value = searchValue.get();
		if (!value) return setFilteredClipboard(clipboardData);

		const filtered = fuzzySearch(clipboardData, value);

		setFilteredClipboard(filtered);
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

		const clipboarData = filteredClipboard.get();

		if (clipboarData.length <= 0) return close();

		const entry = clipboarData[0];

		copyClipboardEntry(entry);
	});

	searchValue.subscribe(() => {
		if (!visible.get()) return;

		const clipboardData = clipboardEntries.get();

		const value = searchValue.get();
		if (!value) return setFilteredClipboard(clipboardData);

		const filtered = fuzzySearch(clipboardData, value);

		setFilteredClipboard(filtered);
	});

	return (
		<box
			orientation={Gtk.Orientation.VERTICAL}
			visible={visible}
			class="clipboard-container"
		>
			<For each={filteredClipboard}>
				{(clipboardEntry) => (
					<box>
						<Gtk.GestureClick
							button={Gdk.BUTTON_PRIMARY}
							onPressed={() => copyClipboardEntry(clipboardEntry)}
						/>

						<label
							halign={Gtk.Align.START}
							label={clipboardEntry.value}
						/>
					</box>
				)}
			</For>
		</box>
	);
}
