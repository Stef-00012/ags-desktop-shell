import type { DiskStat } from "@/types/systemStats";
import { diskUsage } from "@/util/systemStats";
import type { Accessor } from "ags";

interface Props {
	class?: string | Accessor<string>;
}

export default function Disk({ class: className }: Props) {
	function transformLabel(usage: DiskStat) {
		return `${usage.availableSize}`;
	}

	function transformTooltip(usage: DiskStat) {
		return `${usage.usedSize} used out of ${usage.totalSize} (${usage.usagePercent})`;
	}

	return (
		<box class={className}>
			<image iconName="mi-storage-symbolic" class="disk-icon" />

			<label
				label={diskUsage(transformLabel)}
				tooltipMarkup={diskUsage(transformTooltip)}
			/>
		</box>
	);
}
