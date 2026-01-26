import "./env";
import { Telegraf } from "telegraf";
import { plugins } from "./bot/commands";
import { botLogUpdates } from "./bot/middleware/log_updates";
import { botRestrictToOwner } from "./bot/middleware/restrict_to_owner";
import { AppConfig, loadConfig } from "./config";
import { log } from "./logging";
import type { Context } from "telegraf";
import type { Update } from "telegraf/types";

const logger = log.with({ module: "main" });

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
        logger.error("(unhandled error)", err);
    });
    try {
        logger.info("(bot started)", { mode: "polling" });
        await bot.launch();
    } catch (err) {
        logger.error("(failed to start bot)", err);
        process.exit(1);
    }
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((err): never => {
    logger.error("(fatal error in main)", err);
    process.exit(1);
});
