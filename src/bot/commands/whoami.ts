import type { BotApi, Plugin } from "@/bot/types";
import type { User } from "telegraf/types";

export const whoamiPlugin: Plugin = (bot: BotApi): void => {
    bot.command("whoami", async (ctx): Promise<void> => {
        const from: User | undefined = ctx.from;
        if (!from) {
            await ctx.reply("No sender info");
            return;
        }
        await ctx.reply(`id=${from.id}\nusername=${from.username ?? "-"}\nname=${from.first_name ?? "-"}`);
    });
};
