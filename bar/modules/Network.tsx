import { formatNetworkThroughput, networkUsage } from "@/util/systemStats";
import type { NetworkStat } from "@/types/systemStats";
import { getNetworkIcon } from "@/util/icons";
import type { Accessor } from "ags";

interface Props {
	class?: string | Accessor<string>;
}

export default function Network({ class: className }: Props) {
	function transformLabel(stat: NetworkStat) {
		if (stat.isWifi) {
			return `${getNetworkIcon({
				isWifi: stat.isWifi,
				isWired: stat.isWired,
				strength: stat.strength,
			})} ${stat.strength}%`;
		}

		if (stat.isWired) {
			return `${getNetworkIcon({
				isWifi: stat.isWifi,
				isWired: stat.isWired,
			})} Wired`;
		}

		return getNetworkIcon({
			isWifi: stat.isWifi,
			isWired: stat.isWired,
		});
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

	return (
		<box class={className}>
			<label
				label={networkUsage(transformLabel)}
				tooltipMarkup={networkUsage(transformTooltip)}
			/>
		</box>
	);
}
