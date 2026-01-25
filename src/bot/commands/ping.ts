import type { Plugin } from "../types.js";

export const pingPlugin: Plugin = (bot): void => {
    bot.command("ping", async (ctx): Promise<void> => {
        await ctx.reply("pong");
    });
};
