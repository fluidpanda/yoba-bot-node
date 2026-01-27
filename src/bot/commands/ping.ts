import type { BotCommand } from "@/bot/commands";
import type { BotCtx } from "@/bot/types";

export const pingCommand: BotCommand = {
    name: "ping",
    description: "Ping bot",
    menu: {
        label: "Ping",
        action: "menu:ping",
    },
    async handler(ctx: BotCtx): Promise<void> {
        ctx.state.logger?.debug("Ping requested");
        await ctx.reply("Pong");
    },
};
