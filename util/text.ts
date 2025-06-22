import { createState } from "ags";

const [currentMarquee, setCurrentMarquee] = createState<{
    text: string;
    index: number;
}>({
    text: "",
    index: 0,
})

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
        })
	}

	const dividedText = `${text}  `;
	const marqueeText =
		dividedText.slice(marqueeData.index) +
		dividedText.slice(0, marqueeData.index);

	setCurrentMarquee((marqueeData) => {
        return {
            text: marqueeData.text,
            index: (marqueeData.index + 1) % dividedText.length
        }
    });

	return marqueeText.slice(0, width);
}

export function centerText(inputString: string, returnLength?: false): string;
export function centerText(inputString: string, returnLength: true): number;
export function centerText(inputString: string, returnLength?: boolean): number | string {
    const lines = inputString.split("\n");

    let maxLength = 0;

    for (const line of lines) {
        const textContent = line.replace(/<[^>]*>/g, "");

        if (textContent.length > maxLength) maxLength = textContent.length;
    }

    if (returnLength) return maxLength;

    const centeredLines = lines.map((line) => {
        const textContent = line.replace(/<[^>]*>/g, "");
        const paddingBefore = " ".repeat(
            Math.floor((maxLength - textContent.length) / 2),
        );
        const paddingAfter = " ".repeat(
            Math.ceil((maxLength - textContent.length) / 2),
        );
        const centeredLine = `${paddingBefore}${textContent}${paddingAfter}`;

        const htmlTagMatch = line.match(/<[^>]*>/);

        if (htmlTagMatch) {
            const paddedContent = `${paddingBefore}${textContent}${paddingAfter}`;
            
            return line.replace(textContent, paddedContent);
        }

        return centeredLine;
    });

    return centeredLines.join("\n");
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