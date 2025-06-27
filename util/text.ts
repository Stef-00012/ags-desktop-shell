import { url as urlColor } from "@/constants/colors";
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
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

export function parseMarkdown(message: string): string {
	let output = message;

	const urlRegex =
		/\[([^\]]+)\]\(((<|&lt;)?(https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:[^\s>&<]*))(>|&gt;)?\))|\b(https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:[^\s<>()]*)\b)/g;
	const boldRegex = /\*\*(.*?)\*\*/g;
	const italicRegex = /(\*|_)(.*?)\1/g;
	const underlineRegex = /__(.*?)__/g;
	const monocodeRegex = /`([^`]+)`/g;
	const tripleBacktick = /```/g;

	output = message
		.replace(boldRegex, (_match, text) => `<b>${text}</b>`)
		.replace(underlineRegex, (_match, text) => `<u>${text}</u>`)
		.replace(italicRegex, (_match, text) => `<i>${text}</i>`)
		.replace(tripleBacktick, () => "`")
		.replace(monocodeRegex, (_match, text) => `<tt>${text}</tt>`)
		.replace(urlRegex, (match, text, _lt, url) => {
			if (url)
				return colorText(
					`<a href="${url}">${text || url}</a>`,
					urlColor,
				);

			return colorText(`<a href="${match}">${match}</a>`, urlColor);
		});

	return output;
}
