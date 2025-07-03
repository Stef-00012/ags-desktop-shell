import type Apps from "gi://AstalApps";
import { isIcon } from "@/util/icons";
import { Gdk, Gtk } from "ags/gtk4";
import type { Accessor } from "ags";

interface Props {
	app: Apps.Application;
	focused: Accessor<boolean>
	onOpen: () => void;
}

export default function App({ app, focused, onOpen }: Props) {
	function handleLeftClick() {
		onOpen();
	}

	return (
		<box orientation={Gtk.Orientation.HORIZONTAL} class={focused((isFocused) => isFocused ? "app-container focus" : "app-container")}>
			<Gtk.GestureClick
				button={Gdk.BUTTON_PRIMARY}
				onPressed={handleLeftClick}
			/>

			{(app.iconName || isIcon(app.entry)) && (
				<image
					class="app-icon"
					visible={Boolean(app.iconName || app.entry)}
					iconName={app.iconName || app.entry}
					pixelSize={36}
				/>
			)}

			<box
				orientation={Gtk.Orientation.VERTICAL}
				class="app-details"
				valign={Gtk.Align.CENTER}
			>
				<label
					label={app.name}
					class="app-name"
					halign={Gtk.Align.START}
				/>

				{app.description && (
					<label
						label={app.description}
						class="app-description"
						halign={Gtk.Align.START}
					/>
				)}
			</box>
		</box>
	);
}
