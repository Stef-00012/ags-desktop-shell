import { createBinding, With, type Accessor } from "ags";
import { setIsNotificationCenterVisible } from "@/app";
import Notifd from "gi://AstalNotifd";
import { Gdk, Gtk } from "ags/gtk4";

interface Props {
	class?: string | Accessor<string>;
}

export default function Notifications({ class: className }: Props) {
	const notifd = Notifd.get_default();

	const notifs = createBinding(notifd, "notifications");
	const dontDisturb = createBinding(notifd, "dontDisturb");

	function transformLabel(notifications: Notifd.Notification[]) {
		return `${notifications.length}`;
	}

	function transformIcon(dontDisturb: boolean) {
		return dontDisturb
			? "mi-notifications-off-symbolic"
			: "mi-notifications-symbolic";
	}

	function handleLeftClick() {
		setIsNotificationCenterVisible((prev) => !prev);
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
		<box
			class={className}
			cursor={Gdk.Cursor.new_from_name("pointer", null)}
		>
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

			<box
				class={notifs((notifications) =>
					notifications.length > 0
						? "notification-icon unread"
						: "notification-icon",
				)}
			>
				<image iconName={dontDisturb(transformIcon)} class="icon" />

				<With value={notifs}>
					{(notifications) =>
						notifications.length > 0 && (
							<image
								iconName="mi-circle-symbolic"
								class="unread"
								pixelSize={8}
							/>
						)
					}
				</With>
			</box>

			<label label={notifs(transformLabel)} />
		</box>
	);
}
