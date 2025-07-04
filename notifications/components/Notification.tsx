import { escapeMarkup, parseMarkdown } from "@/util/text";
import { defaultConfig } from "@/constants/config";
import { sleep, Timer } from "@/util/timer";
import type Notifd from "gi://AstalNotifd";
import { fileExists } from "@/util/file";
import { time } from "@/util/formatTime";
import { urgency } from "@/util/notif";
import { config } from "@/util/config";
import { isIcon } from "@/util/icons";
import { createState } from "ags";
import Pango from "gi://Pango";
import { Gdk } from "ags/gtk4";
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";

export default function Notification({
	notification,
	onHide,
	isNotificationCenter = false,
}: {
	notification: Notifd.Notification;
	onHide: (notification: Notifd.Notification) => void;
	isNotificationCenter?: boolean;
}) {
	const notificationActions = notification.actions.filter(
		(action) => action.id !== "default",
	);
	const defaultAction = notification.actions.find(
		(action) => action.id === "default",
	);

	const expireTimeout =
		notification.expireTimeout === -1
			? (config.get().timeouts?.defaultNotificationExpire ??
				defaultConfig.timeouts.defaultNotificationExpire)
			: notification.expireTimeout;

	const timer = new Timer(expireTimeout);

	const [progressBarFraction, setProgressBarFraction] =
		createState<number>(1);
	const [isHidden, setIsHidden] = createState(false);

	timer.subscribe(async () => {
		setProgressBarFraction(1 - timer.timeLeft / timer.timeout);

		if (timer.timeLeft <= 0) {
			setIsHidden(true);

			await sleep(
				(config.get().animationsDuration?.notification ??
					defaultConfig.animationsDuration.notification) -
					(config.get().animationsDuration?.notification ??
						defaultConfig.animationsDuration.notification) *
						0.6,
			);

			onHide(notification);
		}
	});

	if (isNotificationCenter) {
		timer.cancel();
	}

	function handleLeftClick() {
		if (!defaultAction) return;

		notification.invoke(defaultAction.id);

		if (!isNotificationCenter) timer.cancel();
	}

	function handleRightClick() {
		onHide(notification);

		if (!isNotificationCenter) timer.cancel();
	}

	function handleMiddleClick() {
		notification.dismiss();

		if (!isNotificationCenter) timer.cancel();
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
				propagationPhase={
					main ? Gtk.PropagationPhase.TARGET : undefined
				}
			/>
		);
	}

	return (
		<revealer
			transitionDuration={config(
				(cfg) =>
					cfg.animationsDuration?.notification ??
					defaultConfig.animationsDuration.notification,
			)}
			transitionType={
				isNotificationCenter
					? Gtk.RevealerTransitionType.NONE
					: Gtk.RevealerTransitionType.SLIDE_LEFT
			}
			$={async (self) => {
				if (isNotificationCenter) self.set_reveal_child(true);
				else {
					await sleep(100);
					self.set_reveal_child(!isHidden.get());
				}

				const unsubscribe = isHidden.subscribe(() => {
					const hidden = isHidden.get();

					if (hidden) {
						self.set_reveal_child(false);
						unsubscribe();
					}
				});
			}}
		>
			<Adw.Clamp maximumSize={530}>
				<box
					cursor={
						defaultAction
							? Gdk.Cursor.new_from_name("pointer", null)
							: undefined
					}
					widthRequest={530}
					class={`notification ${urgency(notification.urgency)} ${isNotificationCenter ? "center" : ""}`}
					orientation={Gtk.Orientation.VERTICAL}
				>
					{!isNotificationCenter && (
						<Gtk.EventControllerMotion
							onEnter={handleHoverEnter}
							onLeave={handleHoverLeave}
						/>
					)}

					{getLeftClickComponent(true)}

					<Gtk.GestureClick
						button={Gdk.BUTTON_SECONDARY}
						onPressed={handleRightClick}
					/>

					<Gtk.GestureClick
						button={Gdk.BUTTON_MIDDLE}
						onPressed={handleMiddleClick}
					/>

					<box class="header">
						{getLeftClickComponent()}

						{(notification.appIcon ||
							isIcon(notification.desktopEntry)) && (
							<image
								class="app-icon"
								visible={Boolean(
									notification.appIcon ||
										notification.desktopEntry,
								)}
								iconName={
									notification.appIcon ||
									notification.desktopEntry
								}
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

						{notification.image &&
							fileExists(notification.image) && (
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
								label={parseMarkdown(
									escapeMarkup(notification.summary),
								)}
								useMarkup
								ellipsize={Pango.EllipsizeMode.END}
								wrapMode={Pango.WrapMode.CHAR}
							/>

							{notification.body && (
								<label
									class="body"
									wrap
									useMarkup
									halign={Gtk.Align.START}
									wrapMode={Pango.WrapMode.CHAR}
									xalign={0}
									label={parseMarkdown(
										escapeMarkup(notification.body),
									)}
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
									cursor={Gdk.Cursor.new_from_name(
										"pointer",
										null,
									)}
									onClicked={() => notification.invoke(id)}
								>
									<label
										label={label}
										halign={Gtk.Align.CENTER}
										hexpand
									/>
								</button>
							))}
						</box>
					)}

					<box>
						<Gtk.ProgressBar
							visible={!isNotificationCenter}
							class="progress-bar"
							hexpand
							fraction={progressBarFraction}
							widthRequest={491} // width - (border-radius * 3)
							halign={Gtk.Align.CENTER}
						/>
					</box>
				</box>
			</Adw.Clamp>
		</revealer>
	);
}
