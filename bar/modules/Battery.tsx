import { createState, createComputed, createBinding } from "ags";
import { formatSeconds } from "@/util/formatTime";
import AstalBattery from "gi://AstalBattery";
import type { Accessor } from "ags";
import { Gdk, Gtk } from "ags/gtk4";
import { execAsync } from "ags/process";

interface Props {
	class?: string | Accessor<string>;
}

export default function Battery({ class: className }: Props) {
	const battery = AstalBattery.get_default();

	const percentage = createBinding(battery, "percentage");
	const isCharging = createBinding(battery, "charging");
	const timeToFull = createBinding(battery, "time_to_full");
	const timeToEmpty = createBinding(battery, "time_to_empty");
	const energyRate = createBinding(battery, "energy_rate");
	const iconName = createBinding(battery, "battery_icon_name");

	const [showAlt, setShowAlt] = createState<boolean>(false);

	const label = createComputed(
		[showAlt, percentage, isCharging, timeToEmpty, timeToFull],
		transformLabel,
	);
	const tooltip = createComputed(
		[percentage, isCharging, timeToEmpty, timeToFull, energyRate],
		transformTooltip,
	);

	percentage.subscribe(() => {
		const perc = Math.round(percentage.get() * 100);
		const charging = isCharging.get();
		const icon = iconName.get();

		const baseCommand = `notify-send -a 'Battery Manager' -i ${icon}`;

		if (charging && perc === 100)
			return execAsync(
				`${baseCommand} 'Charge Completed' 'Battery is at 100%.\nUnplug the charger.'`,
			);

		if (charging) return;

		if (perc === 15 || perc === 10)
			return execAsync(
				`${baseCommand} 'Battery Low' 'Battery is at ${perc}%.\nPlug the charger.'`,
			);
		if (perc <= 5)
			return execAsync(
				`${baseCommand} 'Battery Critical' 'Battery is at ${perc}%.\nPlug the charger.'`,
			);
	});

	function transformLabel(
		showAlt: boolean,
		percentage: number,
		isCharging: boolean,
		timeToEmpty: number,
		timeToFull: number,
	) {
		if (showAlt) {
			if (isCharging) {
				return Math.round(percentage * 100) === 100
					? `Full`
					: `${formatSeconds(timeToFull)}`;
			}

			return ` ${formatSeconds(timeToEmpty)}`;
		}

		return Math.round(percentage * 100) === 100
			? `Full`
			: `${Math.round(percentage * 100)}%`;
	}

	function transformTooltip(
		percentage: number,
		isCharging: boolean,
		timeToEmpty: number,
		timeToFull: number,
		energyRate: number,
	) {
		return [
			`${
				isCharging
					? Math.round(percentage * 100) === 100
						? "Full"
						: `Time to full: ${formatSeconds(timeToFull)}`
					: `Time to empty: ${formatSeconds(timeToEmpty)}`
			}`,
			`Power Drain: ${energyRate}W`,
		].join("\n");
	}

	function leftClickHandler() {
		setShowAlt((prev) => !prev);
	}

	return (
		<box
			class={className}
			cursor={Gdk.Cursor.new_from_name("pointer", null)}
			tooltipMarkup={tooltip}
		>
			<box>
				<Gtk.GestureClick
					button={Gdk.BUTTON_PRIMARY}
					onPressed={leftClickHandler}
				/>

				<image iconName={iconName} class="battery-icon" />

				<label label={label} />
			</box>
		</box>
	);
}
