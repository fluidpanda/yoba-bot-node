import type { BotCommand } from "@/bot/commands";
import type { BotCtx } from "@/bot/types";
import type { User } from "telegraf/types";

export const whoamiCommand: BotCommand = {
    name: "whoami",
    description: "Get who am I",
    menu: {
        label: "Who am I",
        action: "menu:whoami",
    },
    async handler(ctx: BotCtx): Promise<void> {
        const from: User | undefined = ctx.from;
        if (!from) {
            ctx.state.logger?.info("Info requested, but no info", {
                fromId: ctx.from?.id,
            });
            await ctx.reply("No sender info");
            return;
        }
        ctx.state.logger?.info("Info requested", {
            fromId: ctx.from?.id,
        });
        await ctx.reply(`id=${from.id}\nusername=${from.username ?? "-"}\nname=${from.first_name ?? "-"}`);
    },
};
