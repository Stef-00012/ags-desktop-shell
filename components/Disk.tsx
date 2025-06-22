import type { DiskStat } from "@/types/systemStats";
import { getDiskIcon } from "@/util/icons";
import { diskUsage } from "@/util/systemStats";

export default function Disk() {
	function transformLabel(usage: DiskStat) {
		return `${getDiskIcon()} ${usage.availableSize}`;
	}

	function transformTooltip(usage: DiskStat) {
		return `${usage.usedSize} used out of ${usage.totalSize} (${usage.usagePercent})`;
	}

	return (
		<box>
			<label
				label={diskUsage(transformLabel)}
				tooltipMarkup={diskUsage(transformTooltip)}
			/>
		</box>
	);
}
