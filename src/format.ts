import type { LogLevel } from "@/logging/levels";

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

export function formatJson(value: unknown, spaces?: number): string {
    return JSON.stringify(value, null, spaces);
}

export function formatJsonPretty(value: unknown): string {
    return formatJson(value, 4);
}

export interface LogRecord {
    ts: string;
    level: LogLevel;
    msg: string;
    context?: Record<string, unknown>;
}

export function formatLog(rec: LogRecord): string {
    const base = `${rec.ts} ${rec.level.toUpperCase()}: ${rec.msg}`;
    const ctx = rec.context;
    if (!ctx || Object.keys(ctx).length === 0) {
        return base;
    }
    return `${base} ${formatJson(ctx)}`;
}
