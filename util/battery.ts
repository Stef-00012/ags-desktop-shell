import { defaultConfig } from "@/constants/config";
import { createBinding, createEffect, createRoot } from "ags";
import app from "ags/gtk4/app";
import { execAsync } from "ags/process";
import AstalBattery from "gi://AstalBattery";
import { config } from "./config";

createRoot((dispose) => {
	app.connect("shutdown", dispose);

	const battery = AstalBattery.get_default();

	const percentage = createBinding(battery, "percentage");
	const isCharging = createBinding(battery, "charging");
	const iconName = createBinding(battery, "battery_icon_name");

	createEffect(() => {
		const perc = Math.round(percentage() * 100);
		const charging = isCharging();
		const icon = iconName();

		const baseCommand = `notify-send -a 'Battery Manager' -i ${icon}`;
		const batteryFullPercentage =
			config.peek().batteryFullPercentage ??
			defaultConfig.batteryFullPercentage;

		if (charging && perc === batteryFullPercentage)
			return execAsync(
				`${baseCommand} 'Charge Completed' 'Battery is at ${batteryFullPercentage}%.\nUnplug the charger.'`,
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
});
