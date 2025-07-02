import Notification from "./components/Notification";
import { Astal, type Gdk, Gtk } from "ags/gtk4";
import Notifd from "gi://AstalNotifd";
import { timeout } from "ags/time";
import giCairo from "gi://cairo";
import {
	For,
	type Accessor,
	createBinding,
	createComputed,
	createState,
	onCleanup,
} from "ags";

interface Props {
	gdkmonitor: Gdk.Monitor;
	hidden: Accessor<boolean>;
}

export default function NotificationPopups({ gdkmonitor, hidden }: Props) {
	const notifd = Notifd.get_default();

	notifd.set_ignore_timeout(true);

	const maxHeight = gdkmonitor.geometry.height * 0.5;

	const [notifications, setNotifications] = createState(
		[] as Notifd.Notification[],
	);

	const doNotDisturb = createBinding(notifd, "dont_disturb");

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

	function handleHideNotification(notification: Notifd.Notification) {
		if (notification.transient) return notification.dismiss();

		setNotifications((notifications) =>
			notifications.filter((notif) => notif.id !== notification.id),
		);
	}

	let notificationContainer: Gtk.Box | null;
	let window: Gtk.Window | null;

	notifications.subscribe(() => {
		timeout(100, () => {
			if (!window || !notificationContainer) return;

			const [_success, bounds] =
				notificationContainer.compute_bounds(window);

			const height = bounds.get_height();
			const width = bounds.get_width();
			const x = bounds.get_x();
			const y = bounds.get_y();

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

	const windowVisibility = createComputed(
		[hidden, notifications, doNotDisturb],
		(hidden, notifications, doNotDisturb) => {
			return !hidden && !doNotDisturb && notifications.length > 0;
		},
	);

	return (
		<window
			class="notification-popups"
			gdkmonitor={gdkmonitor}
			visible={windowVisibility}
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
								onHide={handleHideNotification}
							/>
						)}
					</For>
				</box>
			</scrolledwindow>
		</window>
	);
}
