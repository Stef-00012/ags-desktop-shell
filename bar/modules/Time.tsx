import { createState, With, type Accessor } from "ags";
import { createPoll } from "ags/time";
import { Gdk, Gtk } from "ags/gtk4";

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

	function transformLabel(timeData: string) {
		const [, , , , hours, minutes, ampm] = timeData.split(" | ");

		return `${hours}:${minutes} ${ampm}`;
	}

	function transformAltLabel(timeData: string) {
		const [day, month, monthDay, year] = timeData.split(" | ");

		return `${year}, ${monthDay} ${month}, ${day}`;
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
		<box
			class={className}
			cursor={Gdk.Cursor.new_from_name("pointer", null)}
		>
			<Gtk.GestureClick
				button={Gdk.BUTTON_PRIMARY}
				onPressed={leftClickHandler}
			/>
			<Gtk.GestureClick
				button={Gdk.BUTTON_SECONDARY}
				onPressed={rightClickHandler}
			/>

			<image iconName="mi-schedule-symbolic" class="time-icon clock" />

			<label label={timeData(transformLabel)} />

			<With value={showAlt}>
				{(showAlt) =>
					showAlt && (
						<box>
							<image
								iconName="mi-calendar-month-symbolic"
								class="time-icon calendar"
							/>

							<label label={timeData(transformAltLabel)} />
						</box>
					)
				}
			</With>

			<popover
				$={(self) => {
					popover = self;
				}}
				onClosed={() => {
					setIsPopoverOpen(false);
				}}
			>
				<Gtk.Calendar class="calendar" />
			</popover>
		</box>
	);
}
