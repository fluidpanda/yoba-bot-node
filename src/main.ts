import "dotenv/config";
import type { Context } from "telegraf";
import type { Update } from "telegraf/types";
import { AppConfig, loadConfig } from "./config.js";
import { botLogUpdates } from "./bot/middleware/log_updates.js";
import { botRestrictToOwner } from "./bot/middleware/restrict_to_owner.js";
import { plugins } from "./bot/commands/index.js";
import { Telegraf } from "telegraf";

async function main(): Promise<void> {
    const config: AppConfig = loadConfig();
    const bot = new Telegraf<Context<Update>>(config.botToken);

    bot.use(botLogUpdates);
    if (config.ownerId !== null) {
        bot.use(botRestrictToOwner(config.ownerId));
    }
    for (const plugin of plugins) {
        plugin(bot);
    }
    bot.catch((err: unknown): void => {
        console.error(`Bot error:`, err);
    });
    await bot.launch();
    console.log("Bot started (polling)");
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((err): never => {
    console.error(err);
    process.exit(1);
});
