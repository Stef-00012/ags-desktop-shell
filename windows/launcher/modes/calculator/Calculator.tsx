import { type Accessor, createEffect, createState, For } from "ags";
import { Gdk, Gtk } from "ags/gtk4";
import { exec, execAsync } from "ags/process";
import type { PressedKey } from "../../Launcher";

interface Props {
	close: () => void;
	searchValue: Accessor<string | null>;
	emptySearch: () => void;
	enterPressed: Accessor<boolean>;
	pressedKey: Accessor<PressedKey | null>;
	visible: Accessor<boolean>;
	closed: Accessor<boolean>;
}

export default function CalculatorMode({
	close,
	searchValue,
	emptySearch,
	enterPressed,
	pressedKey,
	visible,
	closed,
}: Props) {
	const [result, setResult] = createState<string | null>(null);
	const [history, setHistory] = createState<string[]>([]);

	// closed.subscribe(() => {
	// 	if (!closed.peek() || !visible.peek()) return;

	// 	setHistory([]);
	// 	setResult(null);
	// 	close();
	// });

	createEffect(() => {
		if (closed() && visible()) {
			setHistory([]);
			setResult(null);
			close();
		}

		if (enterPressed() && visible()) {
			if (!enterPressed() || !visible()) return;

			const res = result();
			const historyData = history();

			if (!res || historyData[0] === res) return emptySearch();

			setHistory((prev) => [res, ...prev]);
			emptySearch();
			setResult(null);
		}

		if (pressedKey() && visible()) {
			const keyData = pressedKey();

			if (!keyData) return;

			if (keyData.keyval === Gdk.KEY_Escape) {
				setHistory([]);
				setResult(null);
				close();

				return;
			}
		}

		if (searchValue() && visible()) {
			const value = searchValue();
			if (!value) return;

			let res = "Invalid Input";

			try {
				res = exec(`qalc ${value}`);
			} catch (_e) {}

			setResult(res.trim());
		}

		if (visible()) execAsync("qalc -e '0 - 0'"); // to update the exchange rates
	})

	// enterPressed.subscribe(() => {
	// 	if (!enterPressed.peek() || !visible.peek()) return;

	// 	const res = result.peek();
	// 	const historyData = history.peek();

	// 	if (!res || historyData[0] === res) return emptySearch();

	// 	setHistory((prev) => [res, ...prev]);
	// 	emptySearch();
	// 	setResult(null);
	// });

	// pressedKey.subscribe(() => {
	// 	if (!visible.peek()) return;

	// 	const keyData = pressedKey.peek();

	// 	if (!keyData) return;

	// 	if (keyData.keyval === Gdk.KEY_Escape) {
	// 		setHistory([]);
	// 		setResult(null);
	// 		close();

	// 		return;
	// 	}
	// });

	// visible.subscribe(() => {
	// 	if (visible.peek()) execAsync("qalc -e '0 - 0'"); // to update the exchange rates
	// });

	// searchValue.subscribe(() => {
	// 	if (!visible.peek()) return;

	// 	const value = searchValue.peek();
	// 	if (!value) return;

	// 	let res = "Invalid Input";

	// 	try {
	// 		res = exec(`qalc ${value}`);
	// 	} catch (_e) {}

	// 	setResult(res.trim());
	// });

	return (
		<box
			orientation={Gtk.Orientation.VERTICAL}
			visible={visible}
			class="calculator-container"
		>
			<label
				label={result((res) => res || "")}
				halign={Gtk.Align.START}
				class="calculator-result"
			/>

			<Gtk.Separator visible class="calculator-separator" />

			<For each={history}>
				{(historyEntry) => (
					<label halign={Gtk.Align.START} label={historyEntry} />
				)}
			</For>
		</box>
	);
}
