export function formatBytes(bytes: number): string {
    const units: string[] = ["B", "KB", "MB", "GB", "TB"];
    let value: number = bytes;
    let index: number = 0;
    while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index++;
    }
    return `${value.toFixed(2)}${units[index]}`;
}

export function formatMs(ms: number): string {
    const total: number = Math.max(0, Math.floor(ms));
    const units: { value: number; suffix: string }[] = [
        { value: Math.floor(total / 86400000), suffix: "d" },
        { value: Math.floor((total % 86400000) / 3600000), suffix: "h" },
        { value: Math.floor((total % 3600000) / 60000), suffix: "m" },
        { value: Math.floor((total % 60000) / 1000), suffix: "s" },
        { value: total % 1000, suffix: "ms" },
    ];
    const parts: string[] = units
        .filter((unit: { value: number; suffix: string }): boolean => unit.value > 0)
        .map((unit: { value: number; suffix: string }): string => `${unit.value}${unit.suffix}`);
    return parts.length > 0 ? parts.join(" ") : "0ms";
}
