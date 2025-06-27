import GLib from "gi://GLib";

export function formatSeconds(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return "0s";

	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);

	const parts = [];
	if (h > 0) parts.push(`${h}h`);
	if (m > 0) parts.push(`${m}m`);
	if (s > 0 || parts.length === 0) parts.push(`${s}s`);

	return parts.join(" ");
}

export function time(time: number, format = "%H:%M") {
	return GLib.DateTime.new_from_unix_local(time).format(format)!;
}
