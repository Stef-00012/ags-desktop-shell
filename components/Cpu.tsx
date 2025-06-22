import type { CPUInfo } from "@/types/systemStats";
import { getCPUIcon } from "@/util/icons";
import { cpuUsage } from "@/util/systemStats";

export default function Cpu() {
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
		<box>
			<label
				label={cpuUsage(transformLabel)}
				tooltipMarkup={cpuUsage(transformTooltip)}
			/>
		</box>
	);
}
