import type Notifd from "gi://AstalNotifd";

const NOTIFICATION_BATCH_SIZE = 10;

export default async function clearNotifications(
	notifications: Notifd.Notification[],
) {
	for (let i = 0; i < notifications.length; i += NOTIFICATION_BATCH_SIZE) {
		const batch = notifications.slice(i, i + NOTIFICATION_BATCH_SIZE);

		batch.forEach((notif) => {
			notif.dismiss();
		});

		await new Promise((resolve) => setTimeout(resolve, 100));
	}
}
