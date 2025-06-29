import type { CPUInfo } from "@/types/systemStats";
import { cpuUsage } from "@/util/systemStats";
import type { Accessor } from "ags";

interface Props {
	class?: string | Accessor<string>;
}

export default function Cpu({ class: className }: Props) {
	function transformLabel(usage: CPUInfo) {
		return `${usage.total.percentage.toFixed(2)}%`;
	}

	function transformTooltip(usage: CPUInfo) {
		return Object.entries(usage)
			.sort(([a], [b]) => {
				if (a === "total") return -1;
				if (b === "total") return 1;
				return Number(a) - Number(b);
			})
			.map(([coreNumber, coreInfo]) => {
				return `${coreNumber === "total" ? "Total" : `Core ${coreNumber}`}: ${coreInfo.percentage.toFixed(2)}%${coreNumber === "total" ? "\n" : ""}`;
			})
			.join("\n");
	}

	return (
		<box class={className}>
			<image iconName="mi-memory-symbolic" class="cpu-icon" />

			<label
				label={cpuUsage(transformLabel)}
				tooltipMarkup={cpuUsage(transformTooltip)}
			/>
		</box>
	);
}
