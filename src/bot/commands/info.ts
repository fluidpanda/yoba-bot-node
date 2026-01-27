import type { BotApi, BotCtx, Plugin } from "@/bot/types";

export const infoPlugin: Plugin = (bot: BotApi): void => {
    bot.start(async (ctx: BotCtx): Promise<void> => {
        ctx.state.logger?.info("Info requested", {
            fromId: ctx.from?.id,
        });
        await ctx.reply("Command /ping, /raw, /whoami");
    });
};
