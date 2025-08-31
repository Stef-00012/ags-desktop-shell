import Mpris from "gi://AstalMpris";
import { config } from "@/util/config";
import { defaultConfig } from "@/constants/config";

export function getMainPlayer(players: Mpris.Player[], isPlaying?: boolean): Mpris.Player | undefined {
    const configData = config.get();

    const preferredPlayers = configData.players?.preferred || defaultConfig.players.preferred;
    const blacklistedPlayers = configData.players?.blacklisted || defaultConfig.players.blacklisted;

    const filteredPlayers = players.filter(player => {
        if (blacklistedPlayers.includes(player.identity)) return false;
        if (isPlaying && player.playbackStatus !== Mpris.PlaybackStatus.PLAYING) return false;

        return true;
    })
    const sortedPlayers = filteredPlayers.sort((a, b) => {
        const aIndex = preferredPlayers.indexOf(a.identity);
        const bIndex = preferredPlayers.indexOf(b.identity);

        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;

        return aIndex - bIndex;
    })

    return sortedPlayers.shift();
}