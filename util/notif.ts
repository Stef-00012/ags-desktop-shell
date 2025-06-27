import Notifd from "gi://AstalNotifd";

export function urgency(urgency: Notifd.Urgency) {
	const { LOW, CRITICAL } = Notifd.Urgency;

	switch (urgency) {
		case LOW: {
			return "low";
		}

		case CRITICAL: {
			return "critical";
		}

		default: {
			return "normal";
		}
	}
}
