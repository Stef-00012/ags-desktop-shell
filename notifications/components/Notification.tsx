import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw";
import type Notifd from "gi://AstalNotifd";
import Pango from "gi://Pango";
import { isIcon } from "@/util/icons";
import { time } from "@/util/formatTime";
import { urgency } from "@/util/notif";
import { fileExists } from "@/util/file";
import { Gdk } from "ags/gtk4";
import { Timer } from "@/util/timer";
import { createState } from "ags";
// import { timeout } from "ags/time";

const DEFAULT_NOTIFICATION_EXPIRE_TIMEOUT = 5000; // 5 seconds

export default function Notification({
	notification,
	onTimeout,
}: {
	notification: Notifd.Notification;
	onTimeout: (notification: Notifd.Notification) => void;
}) {
	const notificationActions = notification.actions.filter(
		(action) => action.id !== "default",
	);
	const defaultAction = notification.actions.find(
		(action) => action.id === "default",
	);

	const expireTimeout =
		notification.expireTimeout === -1
			? DEFAULT_NOTIFICATION_EXPIRE_TIMEOUT
			: notification.expireTimeout;

	const timer = new Timer(expireTimeout);

	const [progressBarFraction, setProgressBarFraction] = createState<number>(1);

	timer.subscribe(() => {
		setProgressBarFraction(1 - timer.timeLeft / timer.timeout);

		if (timer.timeLeft <= 0) {
			onTimeout(notification);
		}
	});

	function handleLeftClick() {
		if (defaultAction) notification.invoke(defaultAction.id);
	}

	function handleRightClick() {
		notification.dismiss();
	}

	function handleHoverEnter() {
		timer.isPaused = true;
	}

	function handleHoverLeave() {
		timer.isPaused = false;
	}

	/*
		not the best looking thing but it's the only workaround i found because with
		just 1 Gtk.GestureClick it'd take precedence over the button so i had to
		create 1 main + many secondary in each subtree except the button one
	*/
	function getLeftClickComponent(main?: boolean) {
		return (
			<Gtk.GestureClick
				button={Gdk.BUTTON_PRIMARY}
				onPressed={handleLeftClick}
				propagationPhase={main ? Gtk.PropagationPhase.TARGET : undefined}
			/>
		);
	}

	return (
		<Adw.Clamp maximumSize={530}>
			<box
				widthRequest={530}
				class={`notification ${urgency(notification.urgency)}`}
				orientation={Gtk.Orientation.VERTICAL}
			>
				<Gtk.EventControllerMotion
					onEnter={handleHoverEnter}
					onLeave={handleHoverLeave}
				/>

				{getLeftClickComponent(true)}

				<Gtk.GestureClick
					button={Gdk.BUTTON_SECONDARY}
					onPressed={handleRightClick}
				/>

				<box class="header">
					{getLeftClickComponent()}

					{(notification.appIcon || isIcon(notification.desktopEntry)) && (
						<image
							class="app-icon"
							visible={Boolean(
								notification.appIcon || notification.desktopEntry,
							)}
							iconName={notification.appIcon || notification.desktopEntry}
						/>
					)}

					<label
						class="app-name"
						halign={Gtk.Align.START}
						ellipsize={Pango.EllipsizeMode.END}
						label={notification.appName || "Unknown"}
					/>

					<label
						class="time"
						hexpand
						halign={Gtk.Align.END}
						label={time(notification.time)}
					/>
				</box>

				<Gtk.Separator visible />

				<box class="content">
					{getLeftClickComponent()}

					{notification.image && fileExists(notification.image) && (
						<image
							valign={Gtk.Align.START}
							class="image"
							file={notification.image}
						/>
					)}

					{notification.image && isIcon(notification.image) && (
						<box valign={Gtk.Align.START} class="icon-image">
							<image
								iconName={notification.image}
								halign={Gtk.Align.CENTER}
								valign={Gtk.Align.CENTER}
							/>
						</box>
					)}

					<box orientation={Gtk.Orientation.VERTICAL}>
						<label
							class="summary"
							halign={Gtk.Align.START}
							xalign={0}
							label={notification.summary}
							ellipsize={Pango.EllipsizeMode.END}
						/>

						{notification.body && (
							<label
								class="body"
								wrap
								useMarkup
								halign={Gtk.Align.START}
								xalign={0}
								justify={Gtk.Justification.FILL}
								label={notification.body}
							/>
						)}
					</box>
				</box>

				{notificationActions.length > 0 && (
					<box class="actions">
						{notificationActions.map(({ label, id }) => (
							<button
								name="actionButton"
								hexpand
								onClicked={() => notification.invoke(id)}
							>
								<label label={label} halign={Gtk.Align.CENTER} hexpand />
							</button>
						))}
					</box>
				)}

				<box>
					<Gtk.ProgressBar
						class="progress-bar"
						hexpand
						fraction={progressBarFraction}
						widthRequest={491} // width - (border-radius * 3)
						halign={Gtk.Align.CENTER}
					/>
				</box>
			</box>
		</Adw.Clamp>
	);
}
