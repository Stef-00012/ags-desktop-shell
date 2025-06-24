import type { BatteryStat } from "@/types/systemStats";
import { createState, createComputed } from "ags";
import { formatSeconds } from "@/util/formatTime";
import { batteryStat } from "@/util/systemStats";
import { getBatteryIcon } from "@/util/icons";
import type { Accessor } from "ags";
import { Gdk, Gtk } from "ags/gtk4";

interface Props {
	class?: string | Accessor<string>;
}

export default function Battery({ class: className }: Props) {
	const [showAlt, setShowAlt] = createState<boolean>(false);

	const label = createComputed([showAlt, batteryStat], transformLabel);

	function transformLabel(showAlt: boolean, batteryStat: BatteryStat) {
		if (showAlt) {
			if (batteryStat.isCharging) {
				return batteryStat.percentage === 100
					? `${getBatteryIcon(batteryStat.percentage, batteryStat.isCharging)} Full`
					: `${getBatteryIcon(batteryStat.percentage, batteryStat.isCharging)} ${formatSeconds(batteryStat.timeToFull)}`
			} 
			
			return `${getBatteryIcon(batteryStat.percentage, batteryStat.isCharging)} ${formatSeconds(batteryStat.timeToEmpty)}`
		}

		return batteryStat.percentage === 100
			? `${getBatteryIcon(batteryStat.percentage, batteryStat.isCharging)} Full`
			: `${getBatteryIcon(batteryStat.percentage, batteryStat.isCharging)} ${Math.round(batteryStat.percentage)}%`;
	}

	function transformTooltip(batteryStat: BatteryStat) {
		return [
			`${
				batteryStat.isCharging
					? batteryStat.percentage === 100
						? "Full"
						: `Time to full: ${formatSeconds(batteryStat.timeToFull)}`
					: `Time to empty: ${formatSeconds(batteryStat.timeToEmpty)}`
			}`,
			`Power Drain: ${batteryStat.energyRate}W`,
		].join("\n");
	}

	function leftClickHandler() {
		setShowAlt((prev) => !prev);
	}

	return (
		<box class={className} cursor={Gdk.Cursor.new_from_name("pointer", null)}>
			<box>
				<Gtk.GestureClick
					button={Gdk.BUTTON_PRIMARY}
					onPressed={leftClickHandler}
				/>

				<label label={label} tooltipMarkup={batteryStat(transformTooltip)} />
			</box>
		</box>
	);
}
