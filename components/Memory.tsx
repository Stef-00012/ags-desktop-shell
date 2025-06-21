import type { MemoryStat } from "@/types/systemStats";
import { memoryUsage } from "@/util/systemStats";

export default function Memory() {
    function formatLabel(usage: MemoryStat) {
        return `${usage.memory.usage.toFixed(1)}%`
    }

    function formatTooltip(usage: MemoryStat) {
        return [
            `RAM: ${usage.memory.used}/${usage.memory.total} (${usage.memory.usage.toFixed(1)}%)`,
            `SWAP: ${usage.swap.used}/${usage.swap.total} (${usage.swap.usage.toFixed(1)}%)`,
        ].join("\n")
    }

	return (
		<box>
			<label
				label={memoryUsage(formatLabel)}
				tooltipMarkup={memoryUsage(formatTooltip)}
			/>
		</box>
	);
}
