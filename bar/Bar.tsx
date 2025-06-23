import app from "ags/gtk4/app";
import { Astal, type Gdk } from "ags/gtk4";
import Cpu from "@/bar/modules/Cpu";
import Disk from "@/bar/modules/Disk";
import Memory from "@/bar/modules/Memory";
import Battery from "@/bar/modules/Battery";
import Time from "@/bar/modules/Time";
import Microphone from "@/bar/modules/Microphone";
import Speaker from "@/bar/modules/Speaker";
import Network from "@/bar/modules/Network";
import Media from "@/bar/modules/Media";
import Notifications from "@/bar/modules/Notifications";

interface Props {
	gdkmonitor: Gdk.Monitor;
}

export default function Bar({ gdkmonitor }: Props) {
	const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;

	return (
		<window
			visible
			name="bar"
			class="Bar"
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
					<Media mediaClass="media-module" lyricsClass="lyrics-module" />
				</box>

				<box $type="end">
					<box class="speaker">
						<Speaker />
					</box>

					<box class="microphone">
						<Microphone />
					</box>

					<box class="misc">
						<Network class="network-module" />
						<Notifications class="notification-module" />
					</box>
				</box>
			</centerbox>
		</window>
	);
}
