import { type Accessor, createState } from "ags";
import { setIsSessionMenuVisible } from "@/app";
import { execAsync } from "ags/process";
import { Gdk, Gtk } from "ags/gtk4";

interface Props {
	class?: string | Accessor<string>;
}

export default function Power({ class: className }: Props) {
	let popover: Gtk.Popover | null = null;
	const [isPopoverOpen, setIsPopoverOpen] = createState(false);

	function handleLeftClick() {
		setIsSessionMenuVisible((prev) => !prev);
	}

	function handleRightClick() {
		if (popover) {
			if (isPopoverOpen.get()) {
				setIsPopoverOpen(false);
				popover.popdown();
				popover.set_css_classes(
					popover.cssClasses.filter(
						(className) => className !== "open",
					),
				);
			} else {
				setIsPopoverOpen(true);
				popover.popup();
				popover.set_css_classes([...popover.cssClasses, "open"]);
			}
		}
	}

	return (
		<box
			class={className}
			cursor={Gdk.Cursor.new_from_name("pointer", null)}
			tooltipMarkup="Power Actions"
		>
			<Gtk.GestureClick
				button={Gdk.BUTTON_PRIMARY}
				onPressed={handleLeftClick}
			/>

			<Gtk.GestureClick
				button={Gdk.BUTTON_SECONDARY}
				onPressed={handleRightClick}
			/>

			<image iconName="system-shutdown-symbolic" pixelSize={16} />

			<popover
				$={(self) => {
					popover = self as Gtk.Popover;
				}}
				onClosed={(self) => {
					setIsPopoverOpen(false);
					self.set_css_classes(
						self.cssClasses.filter(
							(className) => className !== "open",
						),
					);
				}}
			>
				<box spacing={6} orientation={Gtk.Orientation.VERTICAL}>
					<box spacing={6}>
						<button
							tooltipMarkup="Lock"
							cursor={Gdk.Cursor.new_from_name("pointer", null)}
							onClicked={() => {
								execAsync("loginctl lock-session");
								popover?.popdown();
							}}
						>
							<image
								iconName="mi-lock-symbolic"
								pixel_size={16}
							/>
						</button>

						<button
							tooltipMarkup="Sleep"
							cursor={Gdk.Cursor.new_from_name("pointer", null)}
							onClicked={() => {
								execAsync("systemctl suspend");
								popover?.popdown();
							}}
						>
							<image
								iconName="mi-dark-mode-symbolic"
								pixel_size={16}
							/>
						</button>

						<button
							tooltipMarkup="Logout"
							cursor={Gdk.Cursor.new_from_name("pointer", null)}
							onClicked={() => {
								execAsync("pkill Hyprland");
								popover?.popdown();
							}}
						>
							<image
								iconName="mi-logout-symbolic"
								pixel_size={16}
							/>
						</button>

						<button
							tooltipMarkup="Task Manager"
							cursor={Gdk.Cursor.new_from_name("pointer", null)}
							onClicked={() => {
								execAsync("kitty btop");
								popover?.popdown();
							}}
						>
							<image
								iconName="mi-browse-activity-symbolic"
								pixel_size={16}
							/>
						</button>
					</box>

					<box spacing={6}>
						<button
							tooltipMarkup="Hibernate"
							cursor={Gdk.Cursor.new_from_name("pointer", null)}
							onClicked={() => {
								execAsync("systemctl hibernate");
								popover?.popdown();
							}}
						>
							<image
								iconName="mi-downloading-symbolic"
								pixel_size={16}
							/>
						</button>

						<button
							tooltipMarkup="Shutdown"
							cursor={Gdk.Cursor.new_from_name("pointer", null)}
							onClicked={() => {
								execAsync("systemctl poweroff");
								popover?.popdown();
							}}
						>
							<image
								iconName="mi-power-settings-new-symbolic"
								pixel_size={16}
							/>
						</button>

						<button
							tooltipMarkup="Reboot"
							cursor={Gdk.Cursor.new_from_name("pointer", null)}
							onClicked={() => {
								execAsync("reboot");
								popover?.popdown();
							}}
						>
							<image
								iconName="mi-restart-alt-symbolic"
								pixel_size={16}
							/>
						</button>

						<button
							tooltipMarkup="Reboot to Firmware Settings"
							cursor={Gdk.Cursor.new_from_name("pointer", null)}
							onClicked={() => {
								execAsync("systemctl reboot --firmware-setup");
								popover?.popdown();
							}}
						>
							<image
								iconName="mi-settings-applications-symbolic"
								pixel_size={16}
							/>
						</button>
					</box>
				</box>
			</popover>
		</box>
	);
}
