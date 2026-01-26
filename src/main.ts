import "@/env";
import { Telegraf } from "telegraf";
import { buildCommandPlugins } from "@/bot/commands";
import { buildMiddlewares } from "@/bot/middleware";
import { BotCtx, Plugin } from "@/bot/types";
import { AppConfig, loadConfig } from "@/config";
import { log } from "@/logging";
import { Logger } from "@/logging/logger";

const logger: Logger = log.with({ module: "main" });

async function main(): Promise<void> {
    const startedAtMs: number = Date.now();
    const config: AppConfig = loadConfig();
    const bot = new Telegraf<BotCtx>(config.botToken);

    const middlewares = buildMiddlewares({ ownerId: config.ownerId });
    for (const mw of middlewares) bot.use(mw);

    const plugins: Plugin[] = buildCommandPlugins({ ownerId: config.ownerId, startedAtMs });
    for (const plugin of plugins) plugin(bot);

    bot.catch((err: unknown): void => {
        logger.error("(Unhandled error)", err);
    });

    logger.info("Bot launching...", { mode: "polling" });
    await bot.launch();

    process.once("SIGINT", (): void => bot.stop("SIGINT"));
    process.once("SIGTERM", (): void => bot.stop("SIGTERM"));
}

main().catch((err): never => {
    logger.error("(fatal error in main)", err);
    process.exit(1);
});
