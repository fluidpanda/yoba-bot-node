import "dotenv/config";
import type { Context, MiddlewareFn } from "telegraf";
import type { Update, User } from "telegraf/types";
import { Telegraf } from "telegraf";

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

function safeJson(obj: unknown): string {
    return JSON.stringify(obj, null, 2);
}

function restrictToOwner(ownerId: number): MiddlewareFn<Context<Update>> {
    return async (ctx: Context<Update>, next: () => Promise<void>): Promise<void> => {
        if (ctx.from?.id !== ownerId) {
            return;
        }
        await next();
    };
}

const logUpdates: MiddlewareFn<Context<Update>> = async (
    ctx: Context<Update>,
    next: () => Promise<void>,
): Promise<void> => {
    const from: User | undefined = ctx.from;
    const who: string = from ? `${from.username ?? ""}(${from.id})` : "unknown";
    console.log(`[update] type=${ctx.updateType} from=${who}`);
    await next();
};

async function main(): Promise<void> {
    const token: string = requireEnv("BOT_TOKEN");
    const ownerId: number | null = envInt("OWNER_ID");
    const bot = new Telegraf<Context<Update>>(token);
    bot.use(logUpdates);
    if (ownerId !== null) {
        bot.use(restrictToOwner(ownerId));
    }
    bot.start(async (ctx: Context<Update>): Promise<void> => {
        await ctx.reply("Commands: /ping /whoami /raw");
    });
    bot.command("ping", async (ctx: Context<Update>): Promise<void> => {
        await ctx.reply("pong");
    });
    bot.command("whoami", async (ctx: Context<Update>): Promise<void> => {
        const from: User | undefined = ctx.from;
        if (!from) {
            await ctx.reply("No sender info");
            return;
        }
        await ctx.reply(`id=${from.id}\nusername=${from.username ?? "-"}\nname=${from.first_name ?? "-"}`);
    });
    bot.command("raw", async (ctx: Context<Update>): Promise<void> => {
        const raw: string = safeJson(ctx.update);
        const max = 3500;
        await ctx.reply(raw.length > max ? raw.slice(0, max) + "\n...truncated" : raw);
    });
    await bot.launch();
    console.log("Bot started (polling)");
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((err): never => {
    console.error(err);
    process.exit(1);
});
