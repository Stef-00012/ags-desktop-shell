import { createBinding, createComputed, createState, For, onCleanup } from "ags";
import AppLauncher, { type LauncherMode } from "@/windows/launcher/Launcher";
import NotificationCenter from "@/windows/notifications/NotificationCenter";
import NotificationPopups from "@/windows/notifications/NotificationPopup";
import clearNotifications from "@/util/notifications";
import SessionMenu from "@/windows/sessionMenu/SessionMenu";
import GObject, { register } from "ags/gobject";
import Notifd from "gi://AstalNotifd";
import Apps from "gi://AstalApps";
import style from "./style.scss";
import { Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import OSD from "./windows/osd/OSD";
import Bar from "@/windows/bar/Bar";
import MediaPlayer from "@/windows/mediaPlayer/MediaPlayer";

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

export const [isMediaPlayerVisible, setIsMediaPlayerVisible] =
	createState(false);

export const [appLauncherMode, setAppLauncherMode] =
	createState<LauncherMode>("closed");

const isNotificationPopupHidden = createComputed([isNotificationCenterVisible, isSessionMenuVisible], transformIsNotificationPopupHidden)

const notifd = Notifd.get_default();

isNotificationCenterVisible.subscribe(() => {
	if (isNotificationCenterVisible.get()) {
		if (isSessionMenuVisible.get())
			return setIsNotificationCenterVisible(false);

		setAppLauncherMode("closed");
	}
});

isSessionMenuVisible.subscribe(() => {
	if (isSessionMenuVisible.get()) {
		setIsNotificationCenterVisible(false);
		setAppLauncherMode("closed");
	}
});

appLauncherMode.subscribe(() => {
	if (appLauncherMode.get() !== "closed") {
		if (isSessionMenuVisible.get()) return setAppLauncherMode("closed");

		setIsNotificationCenterVisible(false);
	}
});

function transformIsNotificationPopupHidden(isNotificationCenterVisible: boolean, isSessionMenuVisible: boolean) {
	return isNotificationCenterVisible || isSessionMenuVisible;
}

const instanceName = SRC.includes("desktop-shell")
	? "desktop-shell-dev"
	: "desktop-shell";

app.start({
	css: style,
	gtkTheme: "Adwaita-dark",
	instanceName,
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
							hidden={isNotificationPopupHidden}
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

						<OSD
							gdkmonitor={monitor}
							hidden={isSessionMenuVisible}
						/>

						<SessionMenu
							gdkmonitor={monitor}
							visible={isSessionMenuVisible}
							setVisible={setIsSessionMenuVisible}
						/>

						<MediaPlayer
							gdkmonitor={monitor}
							visible={isMediaPlayerVisible}
							setVisible={setIsMediaPlayerVisible}
						/>
					</WindowTracker>
				)}
			</For>
		);
	},

	requestHandler(request, res) {
		const requestType = request.shift();

		if (!requestType) return res("requestType is missing");

		const apps = new Apps.Apps({
			nameMultiplier: 2,
			entryMultiplier: 0,
			executableMultiplier: 2,
		});

		switch (requestType) {
			case "clear-notif": {
				const notifications = notifd.get_notifications()

				clearNotifications(notifications)

				return res("ok");
			}

			case "toggle-notif": {
				if (isSessionMenuVisible.get())
					return res("session menu is currently open");

				setIsNotificationCenterVisible((prev) => !prev);
				setAppLauncherMode("closed");

				return res("ok");
			}

			case "toggle-session-menu": {
				setIsSessionMenuVisible((prev) => !prev);
				setIsNotificationCenterVisible(false);
				setAppLauncherMode("closed");

				return res("ok");
			}

			case "toggle-launcher-app": {
				if (isSessionMenuVisible.get())
					return res("session menu is currently open");

				apps.reload();

				setAppLauncherMode("app");
				setIsNotificationCenterVisible(false);

				return res("ok");
			}

			case "toggle-launcher-calculator": {
				if (isSessionMenuVisible.get())
					return res("session menu is currently open");

				setAppLauncherMode("calculator");
				setIsNotificationCenterVisible(false);

				return res("ok");
			}

			case "toggle-media-player": {
				if (isSessionMenuVisible.get())
					return res("session menu is currently open");

				setIsMediaPlayerVisible((prev) => !prev);

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
