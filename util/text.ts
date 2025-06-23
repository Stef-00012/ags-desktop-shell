import { createState } from "ags";

const [currentMarquee, setCurrentMarquee] = createState<{
	text: string;
	index: number;
}>({
	text: "",
	index: 0,
});

export function marquee(text: string, width: number): string {
	if (text.length <= width) return text;

	const marqueeData = currentMarquee.get();

	if (marqueeData.text !== text) {
		setCurrentMarquee({
			text,
			index: 0,
		});
	}

	if (text.length < marqueeData.index) {
		setCurrentMarquee({
			text,
			index: 0,
		});
	}

	const dividedText = `${text}  `;
	const marqueeText =
		dividedText.slice(marqueeData.index) +
		dividedText.slice(0, marqueeData.index);

	setCurrentMarquee((marqueeData) => {
		return {
			text: marqueeData.text,
			index: (marqueeData.index + 1) % dividedText.length,
		};
	});

	return marqueeText.slice(0, width);
}

export function colorText(text: string, color: string): string {
	return `<span color="${color}">${text}</span>`;
}

export function escapeMarkup(text: string): string {
	return text
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/&/g, "&amp;");
}
