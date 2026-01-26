import { Plugin } from "@/bot/types";

function safeJson(obj: unknown): string {
    return JSON.stringify(obj, null, 2);
}

export const rawPlugin: Plugin = (bot): void => {
    bot.command("raw", async (ctx): Promise<void> => {
        const raw: string = safeJson(ctx.update);
        const max = 3_500;
        await ctx.reply(raw.length > max ? raw.slice(0, max) + "\ntruncated" : raw);
    });
};
