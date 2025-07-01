import NotificationPopups from "@/notifications/NotificationPopup";
import NotificationCenter from "@/notifications/NotificationCenter";
import { createBinding, createState, For, onCleanup } from "ags";
import AppLauncher, { type LauncherMode } from "@/launcher/Launcher";
import GObject, { register } from "ags/gobject";
import Notifd from "gi://AstalNotifd";
import style from "./style.scss";
import { Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import GLib from "gi://GLib";
import OSD from "./osd/OSD";
import Bar from "@/bar/Bar";
import SessionMenu from "./sessionMenu/SessionMenu";

@register({ Implements: [Gtk.Buildable] })
class WindowTracker extends GObject.Object {
	vfunc_add_child(_: Gtk.Builder, child: Gtk.Window): void {
		onCleanup(() => child.destroy());
	}
}

export const [isNotificationCenterVisible, setIsNotificationCenterVisible] =
	createState(false);

export const [isSessionMenuVisible, setIsSessionMenuVisible] =
	createState(false);

export const [appLauncherMode, setAppLauncherMode] =
	createState<LauncherMode>("closed");

const notifd = Notifd.get_default();

app.start({
	css: style,
	gtkTheme: "Adwaita-dark",
	instanceName: "desktop-shell",
	icons: `${SRC}/icons`,

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
							mode={appLauncherMode}
							setMode={setAppLauncherMode}
						/>

						<OSD gdkmonitor={monitor} />

						<SessionMenu
							gdkmonitor={monitor}
							visible={isSessionMenuVisible}
							setVisible={setIsSessionMenuVisible}
						/>
					</WindowTracker>
				)}
			</For>
		);
	},

	requestHandler(request, res) {
		const [, argv] = GLib.shell_parse_argv(request);

		if (!argv) return res("argv parse error");

		switch (argv[0]) {
			case "clear-notif": {
				notifd.get_notifications().forEach((notif) => notif.dismiss());

				return res("ok");
			}

			case "toggle-notif": {
				if (isSessionMenuVisible.get()) return res("session menu is currently open");

				setIsNotificationCenterVisible((prev) => !prev);
				setAppLauncherMode("closed");

				return res("ok");
			}

			case "toggle-session-menu": {
				setIsSessionMenuVisible((prev) => !prev);
				setIsNotificationCenterVisible(false);
				setAppLauncherMode("closed")

				return res("ok");
			}

			case "toggle-launcher-app": {
				if (isSessionMenuVisible.get()) return res("session menu is currently open");

				setAppLauncherMode("app");
				setIsNotificationCenterVisible(false);

				return res("ok");
			}

			case "toggle-launcher-calculator": {
				if (isSessionMenuVisible.get()) return res("session menu is currently open");

				setAppLauncherMode("calculator");
				setIsNotificationCenterVisible(false);

				return res("ok");
			}

			/* 
				DISABLED because exec("cliphist list") seems to error because it returns
				raw binary image data instead of [[ binary data .. ]] like it would in a TTY
			*/
			
			// case "toggle-launcher-clipboard": {
			// 	setAppLauncherMode("clipboard");
			// 	setIsNotificationCenterVisible(false);

			// 	return res("ok");
			// }

			default: {
				return res("unknown command");
			}
		}
	},
});
