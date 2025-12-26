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
		if (searchValue() && visible()) {
			const value = searchValue();

			const clipboardData = clipboardEntries();

			if (!value) setFilteredClipboard(clipboardData);
			else {
				const filtered = fuzzySearch(clipboardData, value);

				setFilteredClipboard(filtered);
			}
		}

		if (pressedKey() && visible()) {
			const keyData = pressedKey();

			if (keyData && keyData.keyval === Gdk.KEY_Escape) {
				close();
			}
		}

		if (enterPressed() && visible()) {
			const clipboarData = filteredClipboard();

			if (clipboarData.length <= 0) close();
			else {
				const entry = clipboarData[0];

				copyClipboardEntry(entry);
			}
		}

		if (searchValue() && visible()) {
			const clipboardData = clipboardEntries();

			const value = searchValue();
			if (!value) return setFilteredClipboard(clipboardData);

			const filtered = fuzzySearch(clipboardData, value);

			setFilteredClipboard(filtered);
		}
	});

	// visible.subscribe(() => {
	// 	if (!visible.peek()) return;

	// 	const value = searchValue.peek();
	// 	console.log(value, !value);
	// 	if (!value) return setFilteredClipboard(clipboardEntries.peek());
	// });

	// clipboardEntries.subscribe(() => {
	// 	if (!visible.peek()) return;

	// 	const clipboardData = clipboardEntries.peek();

	// 	const value = searchValue.peek();
	// 	if (!value) return setFilteredClipboard(clipboardData);

	// 	const filtered = fuzzySearch(clipboardData, value);

	// 	setFilteredClipboard(filtered);
	// });

	// pressedKey.subscribe(() => {
	// 	if (!visible.peek()) return;

	// 	const keyData = pressedKey.peek();

	// 	if (!keyData) return;

	// 	if (keyData.keyval === Gdk.KEY_Escape) {
	// 		close();

	// 		return;
	// 	}
	// });

	// enterPressed.subscribe(() => {
	// 	if (!enterPressed.peek() || !visible.peek()) return;

	// 	const clipboarData = filteredClipboard.peek();

	// 	if (clipboarData.length <= 0) return close();

	// 	const entry = clipboarData[0];

	// 	copyClipboardEntry(entry);
	// });

	// searchValue.subscribe(() => {
	// 	if (!visible.peek()) return;

	// 	const clipboardData = clipboardEntries.peek();

	// 	const value = searchValue.peek();
	// 	if (!value) return setFilteredClipboard(clipboardData);

	// 	const filtered = fuzzySearch(clipboardData, value);

	// 	setFilteredClipboard(filtered);
	// });

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
