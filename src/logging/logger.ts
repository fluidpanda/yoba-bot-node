import { LogLevel, LogLevelPriority } from "./levels";
import { formatLog } from "@/format";

export interface Logger {
    debug(msg: string, context?: Record<string, unknown>): void;
    info(msg: string, context?: Record<string, unknown>): void;
    warn(msg: string, context?: Record<string, unknown>): void;
    error(msg: string, err?: unknown, context?: Record<string, unknown>): void;

    with(context: Record<string, unknown>): Logger;
}

interface LoggerOptions {
    level: LogLevel;
    baseContext?: Record<string, unknown>;
}

function nowIso(): string {
    return new Date().toISOString();
}

function normalizeError(err: unknown): Record<string, unknown> | undefined {
    if (err instanceof Error) {
        return {
            error: err.message,
            stack: err.stack,
            name: err.name,
        };
    }
    if (typeof err === "string") {
        return { error: err };
    }
    if (err !== undefined) {
        return {
            error: "Non-error thrown",
            value: err,
        };
    }
    return undefined;
}

export function createLogger(opts: LoggerOptions): Logger {
    const minLevel: number = LogLevelPriority[opts.level];
    const baseContext: Record<string, unknown> = opts.baseContext ?? {};
    function log(level: LogLevel, msg: string, context?: Record<string, unknown>): void {
        if (LogLevelPriority[level] < minLevel) {
            return;
        }
        const rec = {
            ts: nowIso(),
            level,
            msg,
            context: { ...baseContext, ...context },
        };
        const line = formatLog(rec);
        if (level === "error") {
            process.stderr.write(line + "\n");
        } else {
            process.stdout.write(line + "\n");
        }
    }
    return {
        debug: (msg: string, context): void => log("debug", msg, context),
        info: (msg: string, context): void => log("info", msg, context),
        warn: (msg: string, context): void => log("warn", msg, context),
        error: (msg: string, err: unknown, context): void => {
            log("error", msg, { ...normalizeError(err), ...context });
        },
        with(extraContext: Record<string, unknown>): Logger {
            return createLogger({
                level: opts.level,
                baseContext: { ...baseContext, ...extraContext },
            });
        },
    };
}
