import type { MemoryStat } from "@/types/systemStats";
import { memoryUsage } from "@/util/systemStats";
import type { Accessor } from "ags";

interface Props {
	class?: string | Accessor<string>;
}

export default function Memory({ class: className }: Props) {
	function formatLabel(usage: MemoryStat) {
		return `${usage.memory.usage.toFixed(1)}%`;
	}

	function formatTooltip(usage: MemoryStat) {
		return [
			`RAM: ${usage.memory.used}/${usage.memory.total} (${usage.memory.usage.toFixed(1)}%)`,
			`SWAP: ${usage.swap.used}/${usage.swap.total} (${usage.swap.usage.toFixed(1)}%)`,
		].join("\n");
	}

	return (
		<box class={className}>
			<image iconName="mi-memory-alt-symbolic" class="ram-icon" />

			<label
				label={memoryUsage(formatLabel)}
				tooltipMarkup={memoryUsage(formatTooltip)}
			/>
		</box>
	);
}
