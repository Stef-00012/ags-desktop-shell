import { Astal, type Gdk, Gtk } from "ags/gtk4";
import Notifd from "gi://AstalNotifd";
import Notification from "./components/Notification";
import { For, createState, onCleanup } from "ags";
import { timeout } from "ags/time";

interface Props {
	gdkmonitor: Gdk.Monitor;
}

const DEFAULT_NOTIFICATION_EXPIRE_TIMEOUT = 5000; // 5 seconds

export default function NotificationPopups({ gdkmonitor }: Props) {
	const notifd = Notifd.get_default();

	const [notifications, setNotifications] = createState(
		new Array<Notifd.Notification>(),
	);

	const notifiedHandler = notifd.connect("notified", (_, id, replaced) => {
		const notification = notifd.get_notification(id);

		const expireTimeout =
			notification.expireTimeout >= 0
				? notification.expireTimeout
				: DEFAULT_NOTIFICATION_EXPIRE_TIMEOUT;

		// TODO: pause timeout when the notif is hovered
		timeout(expireTimeout, () => {
			setNotifications((ns) =>
				ns.filter((n) => n.id !== notification.id),
			)
		});

		if (replaced) {
			setNotifications((notifs) =>
				notifs.map((notif) => (notif.id === id ? notification : notif)),
			);
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

	// console.log(gdkmonitor.geometry.height * 0.5)

	return (
		<window
			class="notification-popups"
			gdkmonitor={gdkmonitor}
			visible={notifications((ns) => ns.length > 0)}
			anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
		>
			<scrolledwindow
				propagateNaturalHeight
				propagateNaturalWidth
				hscrollbarPolicy={Gtk.PolicyType.NEVER}
				maxContentHeight={gdkmonitor.geometry.height * 0.5}
				heightRequest={gdkmonitor.geometry.height * 0.5} // tmp, till i find a way to make its height half the screen without occuping useless space
			>
				<box orientation={Gtk.Orientation.VERTICAL}>
					<For each={notifications}>
						{(notification) => <Notification notification={notification} />}
					</For>
				</box>
			</scrolledwindow>
		</window>
	);
}
