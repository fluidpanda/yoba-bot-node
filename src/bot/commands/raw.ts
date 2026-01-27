import type { BotCommand } from "@/bot/commands";
import type { BotCtx } from "@/bot/types";
import { formatJson } from "@/format";

export const rawCommand: BotCommand = {
    name: "raw",
    description: "Get raw data",
    menu: {
        label: "Raw",
        action: "menu:raw",
    },
    async handler(ctx: BotCtx): Promise<void> {
        const raw: string = formatJson(ctx.update);
        const max = 3_500;
        ctx.state.logger?.debug("Raw requested");
        await ctx.reply(raw.length > max ? raw.slice(0, max) + "\ntruncated" : raw);
    },
};
