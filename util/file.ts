import GLib from "gi://GLib";

export function fileExists(path: string, dir = false) {
	if (dir)
		return GLib.file_test(
			path,
			GLib.FileTest.EXISTS | GLib.FileTest.IS_DIR,
		);
	return GLib.file_test(path, GLib.FileTest.EXISTS);
}
