import type { BatteryStat } from "@/types/systemStats";
import { formatSeconds } from "@/util/formatTime";
import { batteryStat } from "@/util/systemStats";
import { createState, createComputed } from "ags";
import { Gdk, Gtk } from "ags/gtk4";

export default function Battery() {
	const [showAlt, setShowAlt] = createState<boolean>(false);

	const label = createComputed([showAlt, batteryStat], transformLabel);

	function transformLabel(showAlt: boolean, batteryStat: BatteryStat) {
		return showAlt
			? batteryStat.isCharging
				? batteryStat.percentage === 100
					? "Full"
					: formatSeconds(batteryStat.timeToFull)
				: formatSeconds(batteryStat.timeToEmpty)
			: `${batteryStat.percentage}%`;
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
        setShowAlt((prev) => !prev)
    }

	return (
		<box>
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
