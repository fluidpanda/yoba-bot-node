import "@/env";
import { MiddlewareFn, Telegraf } from "telegraf";
import type { BotCtx } from "@/bot/types";
import { BotCommand, buildCommands, commandsPlugin } from "@/bot/commands";
import { buildMiddlewares } from "@/bot/middleware";
import { AppConfig, loadConfig } from "@/config";
import { log } from "@/logging";
import { Logger } from "@/logging/logger";

const logger: Logger = log.with({ module: "main" });

async function main(): Promise<void> {
    const startedAtMs: number = Date.now();
    const config: AppConfig = loadConfig();
    const bot = new Telegraf<BotCtx>(config.botToken);

    const middlewares: MiddlewareFn<BotCtx>[] = buildMiddlewares({ ownerId: config.ownerId });
    for (const mw of middlewares) bot.use(mw);

    const commands: BotCommand[] = buildCommands({ ownerId: config.ownerId, startedAtMs });
    commandsPlugin(commands)(bot);

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
