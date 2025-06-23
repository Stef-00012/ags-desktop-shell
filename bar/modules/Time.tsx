import { Gdk, Gtk } from "ags/gtk4";
import { createPoll } from "ags/time";
import { createComputed, createState, type Accessor } from "ags";
import { getClockIcon } from "@/util/icons";

interface Props {
	class?: string | Accessor<string>;
}

export default function Time({ class: className }: Props) {
	const [showAlt, setShowAlt] = createState<boolean>(false);
	const [isPopoverOpen, setIsPopoverOpen] = createState<boolean>(false);
	let popover: Gtk.Popover | null = null;

	// Full Weekday | Full Month | Day of Month | Full Year | Hours (12h) | Minutes | AM/PM
	const command = "date +'%A | %B | %-d | %Y | %I | %M | %p'";

	const timeData = createPoll("", 1000, command);

	const label = createComputed([showAlt, timeData], transformLabel);

	function transformLabel(showAlt: boolean, timeData: string) {
		const [day, month, monthDay, year, hours, minutes, ampm] =
			timeData.split(" | ");

		return showAlt
			? `${getClockIcon("clock")} ${hours}:${minutes} ${ampm} ${getClockIcon("calendar")} ${year}, ${monthDay} ${month}, ${day}`
			: `${getClockIcon("clock")} ${hours}:${minutes} ${ampm}`;
	}

	function leftClickHandler() {
		setShowAlt((prev) => !prev);
	}

	function rightClickHandler() {
		if (popover) {
			if (isPopoverOpen.get()) {
				setIsPopoverOpen(false);
				popover.popdown();
			} else {
				setIsPopoverOpen(true);
				popover.popup();
			}
		}
	}

	return (
		<box class={className} cursor={Gdk.Cursor.new_from_name("pointer", null)}>
			<Gtk.GestureClick
				button={Gdk.BUTTON_PRIMARY}
				onPressed={leftClickHandler}
			/>
			<Gtk.GestureClick
				button={Gdk.BUTTON_SECONDARY}
				onPressed={rightClickHandler}
			/>

			<label label={label} />

			<popover
				$={(self) => {
					popover = self;
				}}
				onClosed={() => {
					setIsPopoverOpen(false);
				}}
			>
				<Gtk.Calendar />
			</popover>
		</box>
	);
}
