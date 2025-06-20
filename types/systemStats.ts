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