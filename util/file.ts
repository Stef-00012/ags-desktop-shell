import { crust } from "@/constants/colors";
import GdkPixbuf from "gi://GdkPixbuf";
import GLib from "gi://GLib";

export function fileExists(path: string, dir = false) {
	if (dir)
		return GLib.file_test(
			path,
			GLib.FileTest.EXISTS | GLib.FileTest.IS_DIR,
		);

	return GLib.file_test(path, GLib.FileTest.EXISTS);
}

export function getMainColor(path: string): `#${string}` {
    if (!path || !fileExists(path)) return crust;

    const pixbuf = GdkPixbuf.Pixbuf.new_from_file(path);
    const scaled = pixbuf.scale_simple(32, 32, GdkPixbuf.InterpType.BILINEAR);

    if (!scaled) return crust;

    const pixels = scaled.get_pixels();
    const width = scaled.get_width();
    const height = scaled.get_height();
    const n_channels = scaled.get_n_channels();
    const stride = scaled.get_rowstride();

    let red = 0, green = 0, blue = 0;
    let pixelCount = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * stride + x * n_channels;
            red += pixels[idx];
            green += pixels[idx + 1];
            blue += pixels[idx + 2];
            pixelCount++;
        }
    }

    red = Math.round(red / pixelCount);
    green = Math.round(green / pixelCount);
    blue = Math.round(blue / pixelCount);

    const redHex = red.toString(16).padStart(2, '0');
    const greenHex = green.toString(16).padStart(2, '0');
    const blueHex = blue.toString(16).padStart(2, '0');

    return `#${redHex}${greenHex}${blueHex}`;
}