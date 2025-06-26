import { Astal, type Gdk, Gtk } from "ags/gtk4";
import Notifd from "gi://AstalNotifd";
import Notification from "@/notifications/components/Notification";
import { For, createState, onCleanup } from "ags";
import giCairo from "gi://cairo";
import { timeout } from "ags/time";

interface Props {
	gdkmonitor: Gdk.Monitor;
}

export default function NotificationPopups({ gdkmonitor }: Props) {
	const notifd = Notifd.get_default();

	notifd.set_ignore_timeout(true);

	const maxHeight = gdkmonitor.geometry.height * 0.5;

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

	let notificationContainer: Gtk.Box | null;
	let window: Gtk.Window | null;

	notifications.subscribe(() => {
		timeout(10, () => {
			if (!window || !notificationContainer) return;

			const [_success, bounds] = notificationContainer.compute_bounds(
				notificationContainer,
			);

			const height = bounds.get_height();
			const width = bounds.get_width();
			const x = bounds.get_x();
			const y = bounds.get_y();

			console.log(height);

			const surface = window.get_surface();

			const region = new giCairo.Region();

			// @ts-ignore
			region.unionRectangle(
				new giCairo.Rectangle({
					x,
					y,
					height,
					width,
				}),
			);

			surface?.set_input_region(region);
		});
	});

	return (
		<window
			class="notification-popups"
			gdkmonitor={gdkmonitor}
			visible={notifications((ns) => ns.length > 0)}
			anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
			defaultHeight={1}
			$={(self) => {
				window = self;
			}}
		>
			<scrolledwindow
				propagateNaturalHeight
				propagateNaturalWidth
				hscrollbarPolicy={Gtk.PolicyType.NEVER}
				maxContentHeight={maxHeight}
				heightRequest={maxHeight}
			>
				<box
					class="test"
					orientation={Gtk.Orientation.VERTICAL}
					$={(self) => {
						notificationContainer = self;
					}}
					vexpand={false}
					valign={Gtk.Align.START}
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
