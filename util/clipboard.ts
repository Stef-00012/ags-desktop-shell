import { createState } from "ags";
import { monitorFile } from "ags/file";
import { execAsync } from "ags/process";
import { type Timer, timeout } from "ags/time";
import Gio from "gi://Gio";
import GLib from "gi://GLib";

export type ClipboardEntry = {
	number: number;
	value: string;
};

export const [clipboardEntries, setClipboardEntries] = createState<
	ClipboardEntry[]
>([]);

export function updateClipboardEntries() {
	execAsync(["zsh", "-c", `cliphist list`])
		.catch((error) => {
			console.error(error);
		})
		.then((value) => {
			console.log(value);
			if (typeof value !== "string") {
				return;
			}

			if (value.trim() === "") {
				setClipboardEntries([]);

				return;
			}

			const entries = value.split("\n").map((line) => {
				const [numStr, ...textParts] = line.split("\t");
				return {
					number: parseInt(numStr, 10),
					value: textParts.join("\t").trim(),
				};
			});
			console.log(entries);
			setClipboardEntries(entries);
		});
}

export function watchForClipboardUpdates() {
	const dbPath =
		GLib.getenv("CLIPHIST_DB_PATH") ||
		`${GLib.getenv("XDG_CACHE_HOME") ?? `${GLib.get_home_dir()}/.cache`}/cliphist/db`;

	let debounceTimer: Timer | null = null;

	monitorFile(dbPath, (_file, event) => {
		if (event === Gio.FileMonitorEvent.CHANGED) {
			if (debounceTimer) debounceTimer.cancel();

			debounceTimer = timeout(200, () => {
				debounceTimer = null;
				updateClipboardEntries();
			});
		}
	});
}

export function copyClipboardEntry(entry: ClipboardEntry) {
	const imageType = getImageType(entry);
	if (imageType !== null) {
		execAsync([
			"bash",
			"-c",
			`cliphist decode ${entry.number} | wl-copy --type image/${imageType}`,
		]).catch((error) => {
			console.error(error);
		});
	} else {
		execAsync([
			"bash",
			"-c",
			`cliphist decode ${entry.number} | wl-copy`,
		]).catch((error) => {
			console.error(error);
		});
	}
}

export function fuzzySearch(
	arr: ClipboardEntry[],
	query: string,
): ClipboardEntry[] {
	return arr.filter(({ value }) => {
		value = value.toLowerCase();
		query = query.toLowerCase();

		let i = 0,
			lastSearched = -1,
			current = query[i];

		while (current) {
			lastSearched = value.indexOf(current, lastSearched + 1);

			if (lastSearched === -1) {
				return false;
			}

			current = query[++i];
		}

		return true;
	});
}

function getImageType(entry: ClipboardEntry): string | null {
	const pattern =
		/^\[\[ binary data (\d+(?:\.\d+)?) ([A-Za-z]+) ([a-z0-9]+) (\d+)x(\d+) \]\]$/;

	const match = entry.value.match(pattern);

	if (match) {
		return match[3].toLowerCase();
	} else {
		return null;
	}
}

export function deleteClipboardEntry(entry: ClipboardEntry) {
	console.log(`deleting cliphist entry:\n${entry.number}\n${entry.value}`);
	execAsync(["bash", "-c", `echo ${entry.number} | cliphist delete`]).catch(
		(error) => {
			console.error(error);
		},
	);
}

export function wipeClipboardHistory() {
	console.log("wiping cliphist");
	execAsync(`cliphist wipe`).catch((error) => {
		console.error(error);
	});
}
