import type { BotApi, BotCtx, Plugin } from "@/bot/types";

export const pingPlugin: Plugin = (bot: BotApi): void => {
    bot.command("ping", async (ctx: BotCtx): Promise<void> => {
        ctx.state.logger?.debug("Ping requested", {
            text: ctx.text,
        });
        await ctx.reply("pong");
    });
};
