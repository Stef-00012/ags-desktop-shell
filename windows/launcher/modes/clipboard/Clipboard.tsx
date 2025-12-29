import {
	type ClipboardEntry,
	clipboardEntries,
	copyClipboardEntry,
	fuzzySearch,
	updateClipboardEntries,
} from "@/util/clipboard";
import { type Accessor, createEffect, createState, For } from "ags";
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
	>(clipboardEntries.peek());

	createEffect(() => {
		if (!visible()) return;

		if (searchValue()) {
			const value = searchValue();

			const clipboardData = clipboardEntries();

			if (!value) setFilteredClipboard(clipboardData);
			else {
				const filtered = fuzzySearch(clipboardData, value);

				setFilteredClipboard(filtered);
			}
		}

		if (pressedKey()) {
			const keyData = pressedKey();

			if (keyData && keyData.keyval === Gdk.KEY_Escape) {
				close();
			}
		}

		if (enterPressed()) {
			const clipboarData = filteredClipboard();

			if (clipboarData.length <= 0) close();
			else {
				const entry = clipboarData[0];

				copyClipboardEntry(entry);
			}
		}

		if (searchValue()) {
			const clipboardData = clipboardEntries();

			const value = searchValue();
			if (!value) return setFilteredClipboard(clipboardData);

			const filtered = fuzzySearch(clipboardData, value);

			setFilteredClipboard(filtered);
		}
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
