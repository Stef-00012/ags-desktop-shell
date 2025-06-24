import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw";
import type AstalNotifd from "gi://AstalNotifd";
import Pango from "gi://Pango";
import { isIcon } from "@/util/icons";
import { time } from "@/util/formatTime";
import { urgency } from "@/util/notif";
import { fileExists } from "@/util/file";
import { Gdk } from "ags/gtk4";

export default function Notification({
	notification,
}: {
	notification: AstalNotifd.Notification;
}) {
	return (
		<Adw.Clamp maximumSize={530}>
			<box
				widthRequest={530}
				class={`notification ${urgency(notification.urgency)}`}
				orientation={Gtk.Orientation.VERTICAL}
			>
				<Gtk.GestureClick
					button={Gdk.BUTTON_SECONDARY}
					onPressed={() => notification.dismiss()}
				/>

				<box class="header">
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

				{notification.actions.length > 0 && (
					<box class="actions">
						{notification.actions.map(({ label, id }) => (
							<button hexpand onClicked={() => notification.invoke(id)}>
								<label label={label} halign={Gtk.Align.CENTER} hexpand />
							</button>
						))}
					</box>
				)}
			</box>
		</Adw.Clamp>
	);
}
