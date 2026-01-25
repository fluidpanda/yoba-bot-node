export interface AppConfig {
    botToken: string;
    ownerId: number | null;
}

function requireEnv(name: string): string {
    const value: string | undefined = process.env[name];
    if (!value) {
        throw new Error(`Missing required .env var: ${name}`);
    }
    return value;
}

function envInt(name: string): number | null {
    const value: string | undefined = process.env[name];
    if (!value) return null;
    const n: number = Number(value);
    return Number.isFinite(n) ? n : null;
}

export function loadConfig(): AppConfig {
    return {
        botToken: requireEnv("BOT_TOKEN"),
        ownerId: envInt("BOT_OWNER"),
    };
}
