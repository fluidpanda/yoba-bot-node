import type { LogLevel } from "./levels.js";

export interface LogRecord {
    ts: string;
    level: LogLevel;
    msg: string;
    context?: Record<string, unknown>;
}

export function formatLog(rec: LogRecord): string {
    const base = `${rec.ts} ${rec.level.toUpperCase()}: ${rec.msg}`;
    if (!rec.context) {
        return base;
    }
    return `${base} ${JSON.stringify(rec.context, null, 4)}`;
}
