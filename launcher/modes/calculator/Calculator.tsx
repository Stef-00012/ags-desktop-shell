import { createState, For, type Setter, type Accessor } from "ags";
import { exec, execAsync } from "ags/process";
import type { PressedKey } from "../../Launcher";
import { Gdk, Gtk } from "ags/gtk4";

interface Props {
	close: () => void;
	searchValue: Accessor<string | null>;
	setSearchValue: Setter<string | null>;
	enterPressed: Accessor<boolean>;
	pressedKey: Accessor<PressedKey | null>;
	visible: Accessor<boolean>;
	closed: Accessor<boolean>;
}

export default function CalculatorMode({
	close,
	searchValue,
	setSearchValue,
	enterPressed,
	pressedKey,
	visible,
	closed,
}: Props) {
	const [result, setResult] = createState<string | null>(null);
	const [history, setHistory] = createState<string[]>([]);

	closed.subscribe(() => {
		if (!closed.get() || !visible.get()) return;

		setHistory([]);
		setResult(null);
		close();
	});

	enterPressed.subscribe(() => {
		if (!enterPressed.get() || !visible.get()) return;

		const res = result.get();
		const historyData = history.get();

		if (!res || historyData[0] === res) return setSearchValue(null);

		setHistory((prev) => [res, ...prev]);
		setSearchValue(null);
		setResult(null);
	});

	pressedKey.subscribe(() => {
		if (!visible.get()) return;

		const keyData = pressedKey.get();

		if (!keyData) return;

		if (keyData.keyval === Gdk.KEY_Escape) {
			setHistory([]);
			setResult(null);
			close();

			return;
		}
	});

	visible.subscribe(() => {
		if (visible.get()) execAsync("qalc -e '0 - 0'"); // to update the exchange rates
	});

	searchValue.subscribe(() => {
		if (!visible.get()) return;

		const value = searchValue.get();
		if (!value) return;

		let res = "Invalid Input";

		try {
			res = exec(`qalc ${value}`);
		} catch (_e) {}

		setResult(res.trim());
	});

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
