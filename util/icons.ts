import { Gdk, Gtk } from "ags/gtk4";

export function isIcon(icon?: string | null) {
	const iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default()!);

	return icon && iconTheme.has_icon(icon);
}
