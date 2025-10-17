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

	const dividedText = `${text}   `;
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
	// Allowed tags that should NOT be escaped (both opening and closing)
	const allowedTags = ["a", "b", "u", "tt", "s", "i", "span"];

	// Create placeholder map to temporarily replace allowed tags
	const placeholders: { [key: string]: string } = {};
	let placeholderIndex = 0;

	const replaceTagWithPlaceholder = (match: string) => {
		const key = `__ALLOWED_TAG_${placeholderIndex++}__`;
		placeholders[key] = match;
		return key;
	};

	// Protect allowed tags. For <a> we only allow opening tags that include an href attribute.
	const nonATags = allowedTags.filter((t) => t !== "a");

	// Pattern for non-<a> tags (opening or closing), e.g. <b>, </b>, <tt attr="...">
	const nonATagsPattern = `<\\/?(?:${nonATags.join("|")})(?:\\b[^>]*)?>`;

	// Pattern for opening <a> tags that contain an href attribute (allows single/double/no quotes)
	const aOpenWithHrefPattern = `<a\\b[^>]*\\bhref\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+)[^>]*>`;

	// Pattern for closing </a> tags
	const aClosePattern = `<\\/a\\s*>`;

	const tagRegex = new RegExp(`(${aOpenWithHrefPattern}|${aClosePattern}|${nonATagsPattern})`, 'gi');
	const protectedText = text.replace(tagRegex, replaceTagWithPlaceholder);

	// Escape remaining markup
	const escaped = protectedText
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");

	// Restore placeholders back to original allowed tags
	const restored = escaped.replace(/__ALLOWED_TAG_\d+__/g, (ph) => placeholders[ph] || ph);

	return restored;
}

export function parseMarkdown(message: string): string {
	let output = message;
	const urlRegex = /(?:\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)|\[([^\]]+)\]\(<(https?:\/\/[^\s>]+)>\)|\[([^\]]+)\]\(&lt;(https?:\/\/[^&]+)&gt;\))/g;
		// /(https?:\/\/[^\s\)]+)|<(https?:\/\/[^\s>]+)>|&lt;(https?:\/\/[^&]+)&gt;|(https?:\/\/[^\s\[\]<g>()]+)/g
		// /(?:\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)|\[([^\]]+)\]\(<(https?:\/\/[^\s>]+)>\)|\[([^\]]+)\]\(&lt;(https?:\/\/[^&]+)&gt;\)|(https?:\/\/[^\s\[\]<g>()]+))/g;
	const rawUrlRegex = /(?<!href=")(https?:\/\/[^\s\[\]<>()"]+)/g;
	const htmlUrlRegex = /<a href="(.*)">(.*)<\/a>/g
	const boldRegex = /\*\*(.+)\*\*/g;
	const underlineRegex = /__(.+)__/g;
	const italicRegexAsterisk = /\*(.+)\*/g
	const italicRegexUnderline = /_(.+)_/g
	const monocodeRegex = /`([^`]+)`/g;
	const strikethroughRegex = /~~(.+)~~/g;
	const tripleBacktick = /```/g;

	output = message
		.replace(boldRegex, (_match, text) => `<b>${text}</b>`)
		.replace(underlineRegex, (_match, text) => `<u>${text}</u>`)
		.replace(italicRegexAsterisk, (_match, text) => `<i>${text}</i>`)
		.replace(italicRegexUnderline, (_match, text) => `<i>${text}</i>`)
		.replace(strikethroughRegex, (_match, text) => `<s>${text}</s>`)
		.replace(tripleBacktick, () => "`")
		.replace(monocodeRegex, (_match, text) => `<tt>${text}</tt>`)
		.replace(urlRegex, (match, text1, url1, text2, url2, text3, url3) => {
            if (url1) {
                return colorText(
					`<a href="${url1}">${text1 || url1}</a>`,
					urlColor,
				);
            } else if (url2) {
                return colorText(
					`<a href="${url2}">${text2 || url2}</a>`,
					urlColor,
				);
            } else if (url3) {
                return colorText(
					`<a href="${url3}">${text3 || url3}</a>`,
					urlColor,
				);
            }

			// return `<a href="${match}">${match}</a>`
			return match;
		})
		.replace(rawUrlRegex, (match) => {
			return colorText(
				`<a href="${match}">${match}</a>`,
				urlColor,
			);
		})
		.replace(htmlUrlRegex, (_match, url, text) => {
			return colorText(
				`<a href="${url}">${text}</a>`,
				urlColor,
			);
		});

	return output;
}
