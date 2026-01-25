export type LogLevel = "debug" | "info" | "warn" | "error";

export const LogLevelPriority: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};
