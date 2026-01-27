import type { BotApi, Plugin } from "@/bot/types";

export const pingPlugin: Plugin = (bot: BotApi): void => {
    bot.command("ping", async (ctx): Promise<void> => {
        await ctx.reply("pong");
    });
};
