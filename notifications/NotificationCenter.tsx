import { type Accessor, createBinding, For, type Setter } from "ags";
import Notification from "./components/Notification";
import { Gtk, Gdk } from "ags/gtk4";
import { isIcon } from "@/util/icons";
import Notifd from "gi://AstalNotifd";
import { barHeight } from "@/bar/Bar";

interface Props {
	gdkmonitor: Gdk.Monitor;
	visible: Accessor<boolean>;
	setVisible: Setter<boolean>;
}

export default function NotificationCenter({
	gdkmonitor,
	visible,
	setVisible,
}: Props) {
	const notifd = Notifd.get_default();

	const notificationCategories = createBinding(
		notifd,
		"notifications",
	)(transformNotifications);

	const doNotDisturb = createBinding(notifd, "dont_disturb");

	function transformNotifications(notifs: Notifd.Notification[]) {
		const notificationList: {
			icon: string | null;
			title: string;
			notifications: Notifd.Notification[];
			latestTimestamp: number;
		}[] = [];

		for (const notif of notifs) {
			const icon =
				notif.appIcon || isIcon(notif.desktopEntry)
					? notif.appIcon || notif.desktopEntry
					: null;
			const title = notif.appName || "Unknown";
			const time = notif.time;

			const index = notificationList.findIndex((n) => n.title === title);

			if (index >= 0) {
				if (time > notificationList[index].latestTimestamp) {
					notificationList[index].latestTimestamp = time;
				}

				notificationList[index].notifications.push(notif);
			} else {
				notificationList.push({
					icon,
					title,
					latestTimestamp: notif.time,
					notifications: [notif],
				});
			}
		}

		const sortedCategories = notificationList.sort(
			(a, b) => b.latestTimestamp - a.latestTimestamp,
		);

		const sortedNotifCategories = sortedCategories.map((category) => ({
			...category,
			notifications: category.notifications.sort(
				(a, b) => b.time - a.time,
			),
		}));

		return sortedNotifCategories;
	}

	function handleExternalClick() {
		setVisible(false);
	}

	function handleEscKey(
		_e: Gtk.EventControllerKey,
		keyval: number,
		_: number,
		_mod: number,
	) {
		if (keyval === Gdk.KEY_Escape) setVisible(false);
	}

	function handleDndSwitch(_switch: Gtk.Switch, state: boolean) {
		notifd.set_dont_disturb(state);
	}

	return (
		<Gtk.Window
			class="notification-center"
			visible={visible}
			widthRequest={gdkmonitor.geometry.width}
			heightRequest={gdkmonitor.geometry.height}
			valign={Gtk.Align.END}
			title="AGS Notification Center"
			display={gdkmonitor.display}
			onCloseRequest={() => {
				setVisible(false);
			}}
		>
			<Gtk.EventControllerKey onKeyPressed={handleEscKey} />

			<Gtk.GestureClick
				button={Gdk.BUTTON_PRIMARY}
				onPressed={handleExternalClick}
				propagationPhase={Gtk.PropagationPhase.TARGET}
			/>

			<box
				marginTop={barHeight}
				orientation={Gtk.Orientation.VERTICAL}
				widthRequest={540}
				class="notification-container"
				halign={Gtk.Align.END}
			>
				<box class="header" orientation={Gtk.Orientation.VERTICAL}>
					<box
						class="title-container"
						orientation={Gtk.Orientation.HORIZONTAL}
					>
						<label label="Notifications" class="title" />

						<box hexpand />

						<button
							label="Clear All"
							class="dismiss-all"
							onClicked={() => {
								for (const category of notificationCategories.get()) {
									for (const notif of category.notifications) {
										notif.dismiss();
									}
								}
							}}
						/>
					</box>

					<box
						class="dnd-container"
						orientation={Gtk.Orientation.HORIZONTAL}
					>
						<label label="Do not Disturb" class="dnd-title" />

						<box hexpand />

						<switch
							class="dnd-toggle"
							onStateSet={handleDndSwitch}
							state={doNotDisturb}
							active={doNotDisturb}
						/>
					</box>
				</box>

				<Gtk.Separator class="header-separator" visible />

				<scrolledwindow
					propagateNaturalHeight
					propagateNaturalWidth
					hscrollbarPolicy={Gtk.PolicyType.NEVER}
				>
					<box orientation={Gtk.Orientation.VERTICAL}>
						<For each={notificationCategories}>
							{(notificationCategory, index) => (
								<box
									class="category"
									orientation={Gtk.Orientation.VERTICAL}
								>
									<box
										class="category-header"
										orientation={Gtk.Orientation.HORIZONTAL}
									>
										{notificationCategory.icon && (
											<image
												class="category-icon"
												visible={Boolean(
													notificationCategory.icon,
												)}
												iconName={
													notificationCategory.icon
												}
												pixelSize={32}
											/>
										)}

										<label
											class="category-title"
											label={notificationCategory.title}
										/>

										<box hexpand />

										<button
											class="dismiss-category"
											label="X"
											onClicked={() => {
												for (const notif of notificationCategory.notifications) {
													notif.dismiss();
												}
											}}
										/>
									</box>

									{notificationCategory.notifications.map(
										(notif) => (
											<Notification
												notification={notif}
												onHide={(notif) =>
													notif.dismiss()
												}
												isNotificationCenter
											/>
										),
									)}

									{index.get() !==
										notificationCategories.get().length -
											1 && (
										<Gtk.Separator
											class="category-separator"
											visible
										/>
									)}
								</box>
							)}
						</For>
					</box>
				</scrolledwindow>
			</box>
		</Gtk.Window>
	);
}
