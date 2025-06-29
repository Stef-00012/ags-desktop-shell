import Notifications from "./modules/Notifications";
import Microphone from "./modules/Microphone";
import { Astal, type Gdk } from "ags/gtk4";
import Battery from "./modules/Battery";
import Speaker from "./modules/Speaker";
import Network from "./modules/Network";
import Memory from "./modules/Memory";
import Power from "./modules/Power";
import Media from "./modules/Media";
import Disk from "./modules/Disk";
import Time from "./modules/Time";
import Tray from "./modules/Tray";
import Cpu from "./modules/Cpu";
import app from "ags/gtk4/app";

interface Props {
	gdkmonitor: Gdk.Monitor;
}

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
		>
			<centerbox cssName="centerbox">
				<box $type="start" hexpand>
					<box class="resources">
						<Cpu class="cpu-module" />
						<Disk class="disk-module" />
						<Memory />
					</box>

					<box class="battery">
						<Battery class="battery-module" />
					</box>

					<box class="time">
						<Time />
					</box>
				</box>

				<box $type="center">
					<Media
						mediaClass="media-module"
						lyricsClass="lyrics-module"
					/>
				</box>

				<box $type="end">
					<box class="speaker">
						<Speaker />
					</box>

					<box class="microphone">
						<Microphone />
					</box>

					<box class="network">
						<Network />
					</box>

					<box class="misc">
						<Notifications class="notification-module" />
						<Tray />
					</box>

					<box class="power">
						<Power />
					</box>
				</box>
			</centerbox>
		</window>
	);
}
