import { LogLevel } from "./levels";
import { createLogger, Logger } from "./logger";

const levels = new Set<LogLevel>(["debug", "info", "warn", "error"]);

function readLogLevel(): LogLevel {
    const value: string | undefined = process.env.LOG_LEVEL?.toLowerCase();
    return value && levels.has(value as LogLevel) ? (value as LogLevel) : "info";
}

export const log: Logger = createLogger({ level: readLogLevel() });
