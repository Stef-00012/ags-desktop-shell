import Notifications from "./modules/Notifications";
import Microphone from "./modules/Microphone";
import { Astal, type Gdk } from "ags/gtk4";
import Battery from "./modules/Battery";
import Speaker from "./modules/Speaker";
import Network from "./modules/Network";
import Memory from "./modules/Memory";
import Power from "./modules/Power";
import Media from "./modules/Media";
import { timeout } from "ags/time";
import Disk from "./modules/Disk";
import { createState } from "ags";
import Time from "./modules/Time";
import Tray from "./modules/Tray";
import Cpu from "./modules/Cpu";
import app from "ags/gtk4/app";

interface Props {
	gdkmonitor: Gdk.Monitor;
}

export const [barHeight, setBarHeight] = createState(0);

export default function Bar({ gdkmonitor }: Props) {
	const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;

	return (
		<window
			visible
			name="bar"
			class="bar"
			gdkmonitor={gdkmonitor}
			exclusivity={Astal.Exclusivity.EXCLUSIVE}
			anchor={TOP | LEFT | RIGHT}
			application={app}
			$={(self) => {
				timeout(500, () => {
					setBarHeight(self.get_allocated_height());
				});
			}}
		>
			<centerbox cssName="centerbox">
				<box $type="start" hexpand>
					<box class="module-group">
						<Cpu class="cpu-module" />
						<Disk class="disk-module" />
						<Memory />
					</box>

					<box class="module-group">
						<Battery class="battery-module" />
					</box>

					<box class="module-group last">
						<Time class="time" />
					</box>
				</box>

				<box $type="center">
					<Media
						coverClass="image-cover-art"
						mediaClass="module-group"
						lyricsClass="module-group last"
					/>
				</box>

				<box $type="end">
					<box class="module-group">
						<Speaker />
					</box>

					<box class="module-group">
						<Microphone />
					</box>

					<box class="module-group">
						<Network />
					</box>

					<box class="module-group">
						<Notifications class="notification-module" />
						<Tray />
					</box>

					<box class="module-group end">
						<Power />
					</box>
				</box>
			</centerbox>
		</window>
	);
}
