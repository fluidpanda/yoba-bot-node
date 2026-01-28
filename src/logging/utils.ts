import type { LogLevel } from "@/logging/levels";

export function truncateText(text: string | undefined, maxLen: number): string | undefined {
    if (!text) return text;
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + "...truncated";
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
