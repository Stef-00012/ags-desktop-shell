import type { DiskStat } from "@/types/systemStats";
import { diskUsage } from "@/util/systemStats";
import { getDiskIcon } from "@/util/icons";
import type { Accessor } from "ags";

interface Props {
	class?: string | Accessor<string>;
}

export default function Disk({ class: className }: Props) {
	function transformLabel(usage: DiskStat) {
		return `${getDiskIcon()} ${usage.availableSize}`;
	}

	function transformTooltip(usage: DiskStat) {
		return `${usage.usedSize} used out of ${usage.totalSize} (${usage.usagePercent})`;
	}

	return (
		<box class={className}>
			<label
				label={diskUsage(transformLabel)}
				tooltipMarkup={diskUsage(transformTooltip)}
			/>
		</box>
	);
}
