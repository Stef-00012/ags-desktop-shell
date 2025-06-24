import Notifd from "gi://AstalNotifd"

export function urgency(urgency: Notifd.Urgency) {
    const { LOW, NORMAL, CRITICAL } = Notifd.Urgency;
    switch (urgency) {
        case LOW:
            return "low";
        case CRITICAL:
            return "critical";
        // case NORMAL:
        default:
            return "normal";
    }
}