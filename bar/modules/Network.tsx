import { formatNetworkThroughput, networkUsage } from "@/util/systemStats";
import type { NetworkStat } from "@/types/systemStats";
import type { Accessor } from "ags";

interface Props {
	class?: string | Accessor<string>;
}

export default function Network({ class: className }: Props) {
	function transformLabel(stat: NetworkStat) {
		if (stat.isWifi) {
			return `${stat.strength}%`;
		}

		if (stat.isWired) {
			return "Wired";
		}

		return "";
	}

	function transformTooltip(stat: NetworkStat) {
		if (stat.isWifi) {
			return [
				`Up: ${formatNetworkThroughput(stat.tx)}`,
				`Down: ${formatNetworkThroughput(stat.rx)}`,
				`SSID: ${stat.ssid}`,
				`Frequency: ${stat.frequency} GHz`,
				`Interface: ${stat.interface}`,
			].join("\n");
		}

		if (stat.isWired) {
			return [
				`Up: ${formatNetworkThroughput(stat.tx)}`,
				`Down: ${formatNetworkThroughput(stat.rx)}`,
				`Interface: ${stat.interface}`,
			].join("\n");
		}

		return "";
	}

	function transformIcon(stat: NetworkStat) {
		return stat.icon;
	}

	return (
		<box class={className} tooltipMarkup={networkUsage(transformTooltip)}>
			<image
				iconName={networkUsage(transformIcon)}
				class="network-icon"
			/>

			<label label={networkUsage(transformLabel)} />
		</box>
	);
}
