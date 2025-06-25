import { Astal, type Gdk, Gtk } from "ags/gtk4";
import Notifd from "gi://AstalNotifd";
import Notification from "./components/Notification";
import { For, createState, onCleanup } from "ags";
// import { timeout } from "ags/time";

interface Props {
	gdkmonitor: Gdk.Monitor;
}

export default function NotificationPopups({ gdkmonitor }: Props) {
	const notifd = Notifd.get_default();

	notifd.set_ignore_timeout(true);

	const maxHeight = gdkmonitor.geometry.height * 0.5;

	// const [boxHeight, setBoxHeight] = createState(0);

	const [notifications, setNotifications] = createState(
		[] as Notifd.Notification[],
	);

	const notifiedHandler = notifd.connect("notified", (_, id, replaced) => {
		const notification = notifd.get_notification(id);

		if (replaced) {
			setNotifications((notifs) => {
				if (notifs.find((notif) => notif.id === id))
					return notifs.map((notif) =>
						notif.id === id ? notification : notif,
					);
				return [notification, ...notifs];
			});
		} else {
			setNotifications((notifs) => [notification, ...notifs]);
		}
	});

	const resolvedHandler = notifd.connect("resolved", (_, id) => {
		setNotifications((notifs) => notifs.filter((notif) => notif.id !== id));
	});

	onCleanup(() => {
		notifd.disconnect(notifiedHandler);
		notifd.disconnect(resolvedHandler);
	});

	function handleNotificationTimeout(notification: Notifd.Notification) {
		if (notification.transient) return notification.dismiss();

		setNotifications((notifications) =>
			notifications.filter((notif) => notif.id !== notification.id),
		);
	}

	// let win: Gtk.Box;

	// const height = notifications(() => (win ? win.get_allocated_height() : 0));

	// height.subscribe(() => {
	// 	console.log("height", height.get());
	// });

	return (
		<window
			class="notification-popups"
			gdkmonitor={gdkmonitor}
			visible={notifications((ns) => ns.length > 0)}
			anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
			defaultHeight={1}
		>
			<scrolledwindow
				propagateNaturalHeight
				propagateNaturalWidth
				hscrollbarPolicy={Gtk.PolicyType.NEVER}
				maxContentHeight={maxHeight}
				heightRequest={maxHeight} // tmp, till i find a way to make its height half the screen without occuping useless space
			>
				<box
					// class="test"
					orientation={Gtk.Orientation.VERTICAL}
					// $={(self) => {
					// 	win = self;
					// }}
				>
					<For each={notifications}>
						{(notification) => (
							<Notification
								notification={notification}
								onTimeout={handleNotificationTimeout}
							/>
						)}
					</For>
				</box>
			</scrolledwindow>
		</window>
	);
}
