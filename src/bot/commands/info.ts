import type { Plugin } from "../types";

export const infoPlugin: Plugin = (bot): void => {
    bot.start(async (ctx): Promise<void> => {
        await ctx.reply("Command /ping, /raw, /whoami");
    });
};
