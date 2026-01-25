import type { Plugin } from "../types.js";

export const infoPlugin: Plugin = (bot): void => {
    bot.start(async (ctx): Promise<void> => {
        await ctx.reply("Command /ping, /raw, /whoami");
    });
};
