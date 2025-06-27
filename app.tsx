import NotificationPopups from "@/notifications/NotificationPopup";
import NotificationCenter from "@/notifications/NotificationCenter";
import { createBinding, createState, For, onCleanup } from "ags";
import AppLauncher from "@/appLauncher/AppLauncher";
import GObject, { register } from "ags/gobject";
import style from "./style.scss";
import { Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import GLib from "gi://GLib";
import OSD from "./osd/OSD";
import Bar from "@/bar/Bar";

@register({ Implements: [Gtk.Buildable] })
class WindowTracker extends GObject.Object {
	vfunc_add_child(_: Gtk.Builder, child: Gtk.Window): void {
		onCleanup(() => child.destroy());
	}
}

export const [isNotificationCenterVisible, setIsNotificationCenterVisible] =
	createState(false);

export const [isAppLauncherVisible, setIsAppLauncherVisible] =
	createState(false);

app.start({
	css: style,
	gtkTheme: "Adwaita-dark",
	instanceName: "desktop-shell",
	main() {
		const monitors = createBinding(app, "monitors");

		return (
			<For each={monitors}>
				{(monitor) => (
					<WindowTracker>
						<Bar gdkmonitor={monitor} />

						<NotificationPopups
							gdkmonitor={monitor}
							hidden={isNotificationCenterVisible}
						/>

						<NotificationCenter
							gdkmonitor={monitor}
							visible={isNotificationCenterVisible}
							setVisible={setIsNotificationCenterVisible}
						/>

						<AppLauncher
							gdkmonitor={monitor}
							visible={isAppLauncherVisible}
							setVisible={setIsAppLauncherVisible}
						/>

						<OSD gdkmonitor={monitor} />
					</WindowTracker>
				)}
			</For>
		);
	},
	requestHandler(request, res) {
		const [, argv] = GLib.shell_parse_argv(request);

		if (!argv) return res("argv parse error");

		switch (argv[0]) {
			case "toggle-notif": {
				setIsNotificationCenterVisible((prev) => !prev);
				setIsAppLauncherVisible(false);

				return res("ok");
			}

			case "toggle-applauncher": {
				setIsAppLauncherVisible((prev) => !prev);
				setIsNotificationCenterVisible(false);

				return res("ok");
			}

			default: {
				return res("unknown command");
			}
		}
	},
});
