import { createBinding, For, onCleanup } from "ags";
import { Gtk } from "ags/gtk4";
import style from "./style.scss";
import app from "ags/gtk4/app";
import Bar from "@/bar/Bar";
import NotificationPopups from "@/notifications/NotificationPopup";
import GObject, { register } from "ags/gobject";

@register({ Implements: [Gtk.Buildable] })
class WindowTracker extends GObject.Object {
    vfunc_add_child(_: Gtk.Builder, child: Gtk.Window): void {
        onCleanup(() => child.destroy())
    }
}

app.start({
	css: style,
	gtkTheme: "Adwaita-dark",
	main() {
		const monitors = createBinding(app, "monitors");

		return (
			<For each={monitors}>
				{(monitor) => (
					<WindowTracker>
						<Bar gdkmonitor={monitor} />
						<NotificationPopups gdkmonitor={monitor} />
					</WindowTracker>
				)}
			</For>
		)
	},
});