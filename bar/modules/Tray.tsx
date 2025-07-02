import { type Accessor, createBinding, createState, For } from "ags";
import AstalTray from "gi://AstalTray";
import { Gdk, Gtk } from "ags/gtk4";

interface Props {
	class?: string | Accessor<string>;
}

export default function Tray({ class: className }: Props) {
	const tray = AstalTray.get_default();

	const trayItems = createBinding(tray, "items");

	let popover: Gtk.Popover | null = null;
	const [isPopoverOpen, setIsPopoverOpen] = createState(false);

	function handleLeftClick() {
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
				popover.set_state_flags(
					Gtk.StateFlags.FOCUS_WITHIN | Gtk.StateFlags.DIR_LTR,
					true,
				);
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
			tooltipMarkup="Tray Menu"
		>
			<Gtk.GestureClick
				button={Gdk.BUTTON_PRIMARY}
				onPressed={handleLeftClick}
			/>

			<image
				iconName={isPopoverOpen((isOpen) =>
					isOpen ? "mi-stat-1-symbolic" : "mi-stat-minus-1-symbolic",
				)}
			/>

			<popover
				class="tray-popover"
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
				<box spacing={12}>
					<For each={trayItems}>
						{(trayItem) => {
							let popovermenu: Gtk.PopoverMenu | null = null;
							const [isPopoverMenuOpen, setIsPopoverMenuOpen] =
								createState(false);

							if (!trayItem.gicon && !trayItem.title)
								return <box visible={false} />;

							return (
								<box
									class="tray-item"
									cursor={Gdk.Cursor.new_from_name(
										"pointer",
										null,
									)}
								>
									<image
										class="icon"
										gicon={trayItem.gicon}
										tooltipMarkup={
											trayItem.tooltipMarkup ||
											trayItem.title
										}
										pixelSize={18}
									/>

									<Gtk.GestureClick
										button={Gdk.BUTTON_PRIMARY}
										onPressed={() => {
											trayItem.about_to_show();
										}}
										onReleased={(_, x, y) => {
											trayItem.activate(x, y);
										}}
									/>

									<Gtk.GestureClick
										button={Gdk.BUTTON_SECONDARY}
										onPressed={() => {
											trayItem.about_to_show();
										}}
										onReleased={() => {
											if (popovermenu) {
												if (isPopoverMenuOpen.get()) {
													setIsPopoverMenuOpen(false);
													popovermenu.popdown();
													popovermenu.set_css_classes(
														popovermenu.cssClasses.filter(
															(className) =>
																className !==
																"open",
														),
													);
												} else {
													setIsPopoverMenuOpen(true);
													popovermenu.popup();
													popovermenu.set_css_classes(
														[
															...popovermenu.cssClasses,
															"open",
														],
													);
												}
											}
										}}
									/>

									<Gtk.GestureClick
										button={Gdk.BUTTON_MIDDLE}
										onPressed={() => {
											trayItem.about_to_show();
										}}
										onReleased={(_, x, y) => {
											trayItem.secondary_activate(x, y);
										}}
									/>

									<Gtk.PopoverMenu
										class="tray-popover-menu"
										menuModel={trayItem.menuModel}
										onClosed={(self) => {
											setIsPopoverMenuOpen(false);
											self.set_css_classes(
												self.cssClasses.filter(
													(className) =>
														className !== "open",
												),
											);
										}}
										$={(self) => {
											popovermenu = self;

											self.insert_action_group(
												"dbusmenu",
												trayItem.actionGroup,
											);

											trayItem.connect(
												"notify::action-group",
												(item) => {
													self.insert_action_group(
														"dbusmenu",
														item.actionGroup,
													);
												},
											);

											trayItem.connect(
												"notify::menu-model",
												(item) => {
													self.set_menu_model(
														item.menuModel,
													);
												},
											);
										}}
									/>
								</box>
							);
						}}
					</For>
				</box>
			</popover>
		</box>
	);
}
