import { LogLevelPriority } from "./levels";
import type { LogLevel } from "./levels";
import type { LogRecord } from "@/logging/utils";
import { formatLog } from "@/logging/utils";

export interface Logger {
    debug(msg: string, context?: Record<string, unknown>): void;
    info(msg: string, context?: Record<string, unknown>): void;
    warn(msg: string, context?: Record<string, unknown>): void;
    error(msg: string, context?: Record<string, unknown>): void;
    error(msg: string, err?: unknown, context?: Record<string, unknown>): void;

    with(context: Record<string, unknown>): Logger;
}

export interface LogSink {
    write(line: string, level: LogLevel): void;
}

export const stdioSink: LogSink = {
    write(line: string, level: LogLevel): void {
        const stream = level === "error" ? process.stderr : process.stdout;
        stream.write(line + "\n");
    },
};

interface LoggerOptions {
    level: LogLevel;
    baseContext?: Record<string, unknown>;
    sink?: LogSink;
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

function mergeContext(
    base: Record<string, unknown>,
    extra?: Record<string, unknown>,
): Record<string, unknown> | undefined {
    const merged = { ...base, ...(extra ?? {}) };
    return Object.keys(merged).length > 0 ? merged : undefined;
}

function isPlainContext(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !(value instanceof Error);
}

export function createLogger(opts: LoggerOptions): Logger {
    const minLevel: number = LogLevelPriority[opts.level];
    const baseContext: Record<string, unknown> = opts.baseContext ?? {};
    const sink: LogSink = opts.sink ?? stdioSink;
    function emit(level: LogLevel, msg: string, context?: Record<string, unknown>): void {
        if (LogLevelPriority[level] < minLevel) {
            return;
        }
        const rec: LogRecord = {
            ts: nowIso(),
            level,
            msg,
            context: mergeContext(baseContext, context),
        };
        sink.write(formatLog(rec), level);
    }
    function errorImpl(msg: string, a?: unknown, b?: Record<string, unknown>): void {
        // error("msg"):
        if (a === undefined) {
            emit("error", msg);
            return;
        }
        // error("msg", { ctx }):
        if (isPlainContext(a) && b === undefined) {
            emit("error", msg, a);
            return;
        }
        // error("msg", err, { ctx }):
        emit("error", msg, { ...normalizeError(a), ...(b ?? {}) });
    }
    return {
        debug: (msg: string, context: Record<string, unknown>): void => emit("debug", msg, context),
        info: (msg: string, context: Record<string, unknown>): void => emit("info", msg, context),
        warn: (msg: string, context: Record<string, unknown>): void => emit("warn", msg, context),
        error: (msg: string, a?: unknown, b?: Record<string, unknown>): void => errorImpl(msg, a, b),
        with(extraContext: Record<string, unknown>): Logger {
            return createLogger({
                level: opts.level,
                sink,
                baseContext: { ...baseContext, ...extraContext },
            });
        },
    };
}
