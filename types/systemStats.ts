import type Battery from "gi://AstalBattery"

export type CoreInfo = {
    idle: number;
    total: number;
    percentage: number;
};

export type CPUInfo = Record<string, CoreInfo>;

export type NetworkStat = {
    rx: number;
    tx: number;
    interface: string;
};

export type MemoryStat = {
    available: number;
    total: number;
    usage: number;
};

export type DiskStat = {
    device: string;
    totalSize: string;
    usedSize: string;
    availableSize: string;
    usagePercent: string;
    path: string;
};

export type BatteryStat = {
    isPresent: boolean;
    isCharging: boolean;
    percentage: number;
    timeToFull: number;
    timeToEmpty: number;
    capacity: number;
    energyRate: number;
    temperature: number;
    warningLevel: Battery.WarningLevel;
    voltage: number;
}