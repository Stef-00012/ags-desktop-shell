import type { CPUInfo } from "@/types/systemStats";
import { cpuUsage } from "@/util/systemStats";
import { getCPUIcon } from "@/util/icons";
import type { Accessor } from "ags";

interface Props {
	class?: string | Accessor<string>;
}

export default function Cpu({ class: className }: Props) {
	function transformLabel(usage: CPUInfo) {
		return `${getCPUIcon()} ${usage.total.percentage.toFixed(2)}%`;
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
			<label
				label={cpuUsage(transformLabel)}
				tooltipMarkup={cpuUsage(transformTooltip)}
			/>
		</box>
	);
}
