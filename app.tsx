import clearNotifications from "@/util/notifications";
import Bar from "@/windows/bar/Bar";
import {
	createBinding,
	createComputed,
	createEffect,
	createRoot,
	createState,
	For,
	onCleanup,
} from "ags";
import GObject, { register } from "ags/gobject";
import { Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import Apps from "gi://AstalApps";
import Notifd from "gi://AstalNotifd";
// import AppLauncher, { type LauncherMode } from "@/windows/launcher/Launcher";
import MediaPlayer from "@/windows/mediaPlayer/MediaPlayer";
import NotificationCenter from "@/windows/notifications/NotificationCenter";
import NotificationPopups from "@/windows/notifications/NotificationPopup";
import SessionMenu from "@/windows/sessionMenu/SessionMenu";
import { defaultConfig } from "./constants/config";
import style from "./style.scss";
import { config } from "./util/config";
import AppLauncher from "./windows/appLauncher/AppLauncher";
import Calculator from "./windows/calculator/Calculator";
import Clipboard from "./windows/clipboard/Clipboard";
// import { watchForClipboardUpdates } from "./util/clipboard";
import OSD from "./windows/osd/OSD";

@register({ Implements: [Gtk.Buildable] })
class WindowTracker extends GObject.Object {
	vfunc_add_child(_: Gtk.Builder, child: Gtk.Window): void {
		onCleanup(() => child.destroy());
	}
}

const _apps = new Apps.Apps({
	nameMultiplier: 2,
	entryMultiplier: 0,
	executableMultiplier: 2,
});

export const [isNotificationCenterVisible, setIsNotificationCenterVisible] =
	createState(false);

export const [isSessionMenuVisible, setIsSessionMenuVisible] =
	createState(false);

export const [isMediaPlayerVisible, setIsMediaPlayerVisible] =
	createState(false);

export const [isAppLauncherVisible, setIsAppLauncherVisible] =
	createState(false);

export const [isCalculatorVisible, setIsCalculatorVisible] = createState(false);

export const [isClipboardVisible, setIsClipboardVisible] = createState(false);

export const [apps, setApps] = createState<Apps.Apps>(_apps);

const isNotificationPopupHidden = createComputed(() =>
	transformIsNotificationPopupHidden(
		isNotificationCenterVisible(),
		isSessionMenuVisible(),
	),
);

const notifd = Notifd.get_default();

createRoot((dispose) => {
	app.connect("shutdown", dispose);

	createEffect(() => {
		switch (true) {
			case isNotificationCenterVisible(): {
				if (isSessionMenuVisible())
					return setIsNotificationCenterVisible(false);

				closeLaunchers();

				break;
			}

			case isSessionMenuVisible(): {
				setIsNotificationCenterVisible(false);
				closeLaunchers();

				break;
			}

			case isAppLauncherVisible(): {
				if (isSessionMenuVisible())
					return setIsAppLauncherVisible(false);

				setIsNotificationCenterVisible(false);

				break;
			}

			case isCalculatorVisible(): {
				if (isSessionMenuVisible())
					return setIsCalculatorVisible(false);

				setIsNotificationCenterVisible(false);

				break;
			}

			case isClipboardVisible(): {
				if (isSessionMenuVisible()) return setIsClipboardVisible(false);

				setIsNotificationCenterVisible(false);

				break;
			}
		}
	});
});

function transformIsNotificationPopupHidden(
	isNotificationCenterVisible: boolean,
	isSessionMenuVisible: boolean,
) {
	return isNotificationCenterVisible || isSessionMenuVisible;
}

function closeLaunchers() {
	setIsClipboardVisible(false);
	setIsAppLauncherVisible(false);
	setIsCalculatorVisible(false);
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
		const mainMonitor = monitors()[0];

		// watchForClipboardUpdates();

		// return (
		// 	<For each={monitors}>
		// 		{(monitor) => (
		// 			<WindowTracker>
		// 				<Bar gdkmonitor={monitor} />

		// 				<NotificationPopups
		// 					gdkmonitor={monitor}
		// 					hidden={isNotificationPopupHidden}
		// 				/>

		// 				<NotificationCenter
		// 					gdkmonitor={monitor}
		// 					visible={isNotificationCenterVisible}
		// 					setVisible={setIsNotificationCenterVisible}
		// 				/>

		// 				<AppLauncher
		// 					gdkmonitor={monitor}
		// 					visible={isAppLauncherVisible}
		// 					setVisible={setIsAppLauncherVisible}
		// 				/>

		// 				<Calculator
		// 					gdkmonitor={monitor}
		// 					visible={isCalculatorVisible}
		// 					setVisible={setIsCalculatorVisible}
		// 				/>

		// 				<Clipboard
		// 					gdkmonitor={monitor}
		// 					visible={isClipboardVisible}
		// 					setVisible={setIsClipboardVisible}
		// 				/>

		// 				<OSD
		// 					gdkmonitor={monitor}
		// 					hidden={isSessionMenuVisible}
		// 				/>

		// 				<SessionMenu
		// 					gdkmonitor={monitor}
		// 					visible={isSessionMenuVisible}
		// 					setVisible={setIsSessionMenuVisible}
		// 				/>

		// 				<MediaPlayer
		// 					gdkmonitor={monitor}
		// 					visible={isMediaPlayerVisible}
		// 					setVisible={setIsMediaPlayerVisible}
		// 				/>
		// 			</WindowTracker>
		// 		)}
		// 	</For>
		// );

		return (
			<WindowTracker>
				<For each={monitors}>
					{(monitor) => <Bar gdkmonitor={monitor} />}
				</For>

				<NotificationPopups
					gdkmonitor={mainMonitor}
					hidden={isNotificationPopupHidden}
				/>

				<NotificationCenter
					gdkmonitor={mainMonitor}
					visible={isNotificationCenterVisible}
					setVisible={setIsNotificationCenterVisible}
				/>

				<AppLauncher
					gdkmonitor={mainMonitor}
					visible={isAppLauncherVisible}
					setVisible={setIsAppLauncherVisible}
				/>

				<Calculator
					gdkmonitor={mainMonitor}
					visible={isCalculatorVisible}
					setVisible={setIsCalculatorVisible}
				/>

				<Clipboard
					gdkmonitor={mainMonitor}
					visible={isClipboardVisible}
					setVisible={setIsClipboardVisible}
				/>

				<OSD gdkmonitor={mainMonitor} hidden={isSessionMenuVisible} />

				<SessionMenu
					gdkmonitor={mainMonitor}
					visible={isSessionMenuVisible}
					setVisible={setIsSessionMenuVisible}
				/>

				<MediaPlayer
					gdkmonitor={mainMonitor}
					visible={isMediaPlayerVisible}
					setVisible={setIsMediaPlayerVisible}
				/>
			</WindowTracker>
		);
	},

	requestHandler(request, res) {
		const requestType = request.shift();

		if (!requestType) return res("requestType is missing");

		switch (requestType) {
			case "clear-notif": {
				const notifications = notifd.get_notifications();

				clearNotifications(notifications);

				return res("ok");
			}

			case "toggle-notif": {
				if (isSessionMenuVisible.peek())
					return res("session menu is currently open");

				setIsNotificationCenterVisible((prev) => !prev);
				closeLaunchers();

				return res("ok");
			}

			case "toggle-session-menu": {
				setIsSessionMenuVisible((prev) => !prev);
				setIsNotificationCenterVisible(false);
				closeLaunchers();

				return res("ok");
			}

			case "toggle-launcher-app": {
				if (isSessionMenuVisible.peek())
					return res("session menu is currently open");

				_apps.reload();

				setApps(_apps);

				setIsAppLauncherVisible(true);
				setIsNotificationCenterVisible(false);

				return res("ok");
			}

			case "toggle-launcher-calculator": {
				if (isSessionMenuVisible.peek())
					return res("session menu is currently open");

				setIsCalculatorVisible(true);
				setIsNotificationCenterVisible(false);

				return res("ok");
			}

			case "toggle-media-player": {
				if (isSessionMenuVisible.peek())
					return res("session menu is currently open");

				setIsMediaPlayerVisible((prev) => !prev);

				return res("ok");
			}

			/* 
				DISABLED because exec("cliphist list") seems to error because it returns
				raw binary image data instead of [[ binary data .. ]] like it would in a TTY
			*/

			case "toggle-launcher-clipboard": {
				// setAppLauncherMode("clipboard");
				setIsNotificationCenterVisible(false);

				// updateClipboardEntries();

				return res("ok");
			}

			case "print-config": {
				const outputConfig = {
					...defaultConfig,
					...config.peek(),
				};

				const outputConfigString = JSON.stringify(
					outputConfig,
					null,
					4,
				);

				return res(outputConfigString);
			}

			default: {
				return res("unknown command");
			}
		}
	},
});
