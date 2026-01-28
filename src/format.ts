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
