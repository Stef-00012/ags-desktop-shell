import app from "ags/gtk4/app";
import style from "./style.scss";
import Bar from "@/bar/Bar";
import { createBinding, For } from "ags";
import type { Gtk } from "ags/gtk4";

app.start({
	css: style,
	gtkTheme: "Adwaita-dark",
	main() {
		const monitors = createBinding(app, "monitors");

		return (
			<For each={monitors} cleanup={(win) => (win as Gtk.Window).destroy()}>
				{(monitor) => <Bar gdkmonitor={monitor} />}
			</For>
		);
	},
});
