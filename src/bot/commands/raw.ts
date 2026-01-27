import { BotApi, BotCtx, Plugin } from "@/bot/types";
import { formatJson } from "@/format";

export const rawPlugin: Plugin = (bot: BotApi): void => {
    bot.command("raw", async (ctx: BotCtx): Promise<void> => {
        const raw: string = formatJson(ctx.update);
        const max = 3_500;
        ctx.state.logger?.debug("Raw requested", {
            text: ctx.text,
        });
        await ctx.reply(raw.length > max ? raw.slice(0, max) + "\ntruncated" : raw);
    });
};
