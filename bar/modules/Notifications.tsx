import { createBinding, type Accessor } from "ags";
import { getNotificationIcon } from "@/util/icons";
import Notifd from "gi://AstalNotifd";
import { Gdk, Gtk } from "ags/gtk4";

interface Props {
	class?: string | Accessor<string>;
}

export default function Notifications({ class: className }: Props) {
	const notifd = Notifd.get_default();

	const notifs = createBinding(notifd, "notifications");

	function transformLabel(notifications: Notifd.Notification[]) {
		return `${getNotificationIcon(notifications.length > 0, notifd.dontDisturb)} ${notifications.length}`;
	}

	function handleLeftClick() {
		// oopen notification viewer
	}

	function handleRightClick() {
		notifd.set_dont_disturb(!notifd.dontDisturb);
	}

	function handleMiddleClick() {
		const notifications = notifd.get_notifications();

		for (const notification of notifications) {
			notification.dismiss();
		}
	}

	return (
		<box class={className} cursor={Gdk.Cursor.new_from_name("pointer", null)}>
			<Gtk.GestureClick
				button={Gdk.BUTTON_PRIMARY}
				onPressed={handleLeftClick}
			/>

			<Gtk.GestureClick
				button={Gdk.BUTTON_SECONDARY}
				onPressed={handleRightClick}
			/>

			<Gtk.GestureClick
				button={Gdk.BUTTON_MIDDLE}
				onPressed={handleMiddleClick}
			/>

			<label label={notifs(transformLabel)} useMarkup />
		</box>
	);
}
