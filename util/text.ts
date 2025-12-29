import { url as urlColor } from "@/constants/colors";
import { createState } from "ags";
import { URL } from "./fetch";

const [currentMarquee, setCurrentMarquee] = createState<{
	text: string;
	index: number;
}>({
	text: "",
	index: 0,
});

export function marquee(text: string, width: number): string {
	if (text.length <= width) return text;

	const marqueeData = currentMarquee.peek();

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

export function escapeTextForPango(text: string) {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

export function parseMarkdownToPango(input: string): string {
	if (!input) return "";

	const codeMap = new Map<string, string>();
	const linkMap = new Map<string, string>();

	let phCounter = 0;

	const makePlaceholder = (type: "CODE" | "LINK") =>
		`__PH_${type}_${phCounter++}__`;

	function escapeAttr(attr: string) {
		return attr
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	}

	function validateHttpUrl(raw: string): string | null {
		if (!raw) return null;

		raw = raw.trim();

		if (raw.startsWith("<") && raw.endsWith(">"))
			raw = raw.slice(1, -1).trim();

		try {
			const u = new URL(raw);

			if (u.protocol === "http:" || u.protocol === "https:") {
				return u.toString();
			}

			return null;
		} catch {
			return null;
		}
	}

	function storeCodeFragment(pangoFragment: string) {
		const ph = makePlaceholder("CODE");
		codeMap.set(ph, pangoFragment);

		return ph;
	}

	function storeLinkFragment(pangoFragment: string) {
		const ph = makePlaceholder("LINK");
		linkMap.set(ph, pangoFragment);

		return ph;
	}

	input = input.replace(/```([\s\S]*?)```/g, (_m, code) => {
		const escaped = escapeTextForPango(code);

		return storeCodeFragment(`<tt>${escaped}</tt>`);
	});

	const lines = input.split(/\r?\n/);
	const headingLines = new Set<number>();

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const matches = line.match(/^\s{0,}(#{1,5})\s+(.*)$/);

		if (matches) {
			lines[i] = matches[2];
			headingLines.add(i);
		}
	}

	input = lines.join("\n");

	input = input.replace(/`([^`\n]+?)`/g, (_m, code) => {
		const escaped = escapeTextForPango(code);

		return storeCodeFragment(`<tt>${escaped}</tt>`);
	});

	input = input.replace(/<tt>([\s\S]*?)<\/tt>/gi, (_m, code) => {
		const escaped = escapeTextForPango(code);

		return storeCodeFragment(`<tt>${escaped}</tt>`);
	});

	input = input.replace(
		/<a\s+[^>]*?href=(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi,
		(_m, g1, g2, g3, inner) => {
			const rawHref = g1 || g2 || g3 || "";
			const valid = validateHttpUrl(rawHref);
			const innerText = escapeTextForPango(stripHtml(inner));

			if (!valid) {
				return innerText;
			}

			const frag = `<a href="${escapeAttr(valid)}"><span foreground="${escapeAttr(urlColor)}">${innerText}</span></a>`;
			return storeLinkFragment(frag);
		},
	);

	input = input.replace(
		/\[([^\]]+)\]\(\s*(<[^>]+>|[^)\s]+)\s*\)/g,
		(_m, text, rawHref) => {
			let href = rawHref;

			if (href.startsWith("<") && href.endsWith(">"))
				href = href.slice(1, -1);

			const valid = validateHttpUrl(href);
			const textEsc = escapeTextForPango(stripHtml(text));

			if (!valid) return textEsc;

			const frag = `<a href="${escapeAttr(valid)}"><span foreground="${escapeAttr(urlColor)}">${textEsc}</span></a>`;
			return storeLinkFragment(frag);
		},
	);

	input = input.replace(/\bhttps?:\/\/[^\s<>()\]]+/gi, (m) => {
		let urlStr = m;

		while (urlStr.length && /[.,:;!?)]$/.test(urlStr))
			urlStr = urlStr.slice(0, -1);

		const trailing = m.slice(urlStr.length);
		const valid = validateHttpUrl(urlStr);

		if (!valid) return escapeTextForPango(m);

		const frag = `<a href="${escapeAttr(valid)}"><span foreground="${escapeAttr(urlColor)}">${escapeTextForPango(urlStr)}</span></a>`;
		const ph = storeLinkFragment(frag);

		return ph + escapeTextForPango(trailing);
	});

	function stripHtml(s: string) {
		return s.replace(/<\/?[^>]+>/g, "");
	}

	const allPlaceholders = Array.from(codeMap.keys()).concat(
		Array.from(linkMap.keys()),
	);

	const placeholderToToken = new Map<string, string>();
	const tokenToPlaceholder = new Map<string, string>();
	allPlaceholders.forEach((ph, idx) => {
		const token = `@@PH_${idx}@@`;
		placeholderToToken.set(ph, token);
		tokenToPlaceholder.set(token, ph);
	});

	function hidePlaceholders(s: string) {
		for (const [ph, token] of placeholderToToken) {
			s = s.split(ph).join(token);
		}

		return s;
	}

	function restorePlaceholders(s: string) {
		for (const [token, ph] of tokenToPlaceholder) {
			s = s.split(token).join(ph);
		}

		return s;
	}

	let work = hidePlaceholders(input);

	work = work.replace(/\*\*([\s\S]+?)\*\*/g, (_m, inner) => {
		const content = escapePreserveTokens(inner);

		return `<b>${content}</b>`;
	});

	work = work.replace(/~~([\s\S]+?)~~/g, (_m, inner) => {
		const content = escapePreserveTokens(inner);

		return `<s>${content}</s>`;
	});

	work = work.replace(/(?<!\w)__((?:[\s\S]*?)?)__(?!\w)/g, (_m, inner) => {
		const content = escapePreserveTokens(inner);

		return `<u>${content}</u>`;
	});

	work = work.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, (_m, inner) => {
		const content = escapePreserveTokens(inner);

		return `<i>${content}</i>`;
	});

	work = work.replace(/(?<!\w)_([^_\n]+?)_(?!\w)/g, (_m, inner) => {
		const content = escapePreserveTokens(inner);

		return `<i>${content}</i>`;
	});

	work = restorePlaceholders(work);

	for (const [ph, frag] of linkMap) {
		work = work.split(ph).join(frag);
	}

	for (const [ph, frag] of codeMap) {
		work = work.split(ph).join(frag);
	}

	const workLines = work.split(/\r?\n/);

	for (const idx of Array.from(headingLines)) {
		if (idx >= 0 && idx < workLines.length) {
			workLines[idx] = `<b>${workLines[idx]}</b>`;
		}
	}

	work = workLines.join("\n");

	work = sanitizeAllowedTags(work);

	return work;

	function escapePreserveTokens(s: string) {
		const parts = s.split(/(@@PH_[0-9]+@@)/g);

		return parts
			.map((p) => {
				if (/^@@PH_[0-9]+@@$/.test(p)) return p;
				return escapeTextForPango(p);
			})
			.join("");
	}

	function sanitizeAllowedTags(s: string) {
		const allowedTagRegex =
			/<(\/?(?:a\b[^>]*|b\b|i\b|u\b|s\b|tt\b|span\b)[^>]*)>/gi;
		const allowed = new Map<string, string>();

		let idx = 0;

		s = s.replace(allowedTagRegex, (m) => {
			const key = `__ALLOWED_TAG_${idx++}__`;
			allowed.set(key, m);
			return key;
		});
		s = s.replace(/</g, "&lt;").replace(/>/g, "&gt;");

		for (const [k, v] of allowed) {
			s = s.split(k).join(v);
		}

		return s;
	}
}
