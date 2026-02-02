import "@/env";
import { session, Telegraf } from "telegraf";
import type { MenuId } from "@/bot/menu/register";
import type { BotCtx } from "@/bot/types";
import type { AppConfig } from "@/config";
import type { Logger } from "@/logging/logger";
import type { RoutersConfig } from "@/routers/config";
import type { MiddlewareFn } from "telegraf";
import { buildMenus } from "@/bot/menu";
import { registerMenu } from "@/bot/menu/register";
import { buildMiddlewares } from "@/bot/middleware";
import { loadConfig } from "@/config";
import { log } from "@/logging";
import { loadRoutersConfig } from "@/routers/config";

const logger: Logger = log.with({ module: "main" });

async function main(): Promise<void> {
    const startedAtMs: number = Date.now();
    const appConfig: AppConfig = loadConfig();
    const routers: RoutersConfig = loadRoutersConfig();
    const deps = {
        status: {
            ownerId: appConfig.ownerId,
            startedAtMs,
        },
        routers,
    } as const;
    const menus = buildMenus(deps);
    const bot = new Telegraf<BotCtx>(appConfig.botToken);

    // yoba hack 9000:
    bot.use(
        session({
            defaultSession: () => ({}),
        }),
    );

    // Ensure app config is always present in ctx.state
    bot.use((ctx: BotCtx, next): Promise<void> => {
        ctx.state.config = appConfig;
        return next();
    });

    const middlewares: MiddlewareFn<BotCtx>[] = buildMiddlewares({ ownerId: appConfig.ownerId });
    for (const mw of middlewares) bot.use(mw);

    bot.catch((err: unknown): void => {
        logger.error("(Unhandled error)", err);
    });

    registerMenu(bot, {
        menus,
        columnsByMenu: { main: 4, tools: 4, routers: 4, router_actions: 4 },
        getMenuId: (ctx: BotCtx): MenuId => ctx.session.menu ?? "main",
        setMenuId: (ctx: BotCtx, menu: MenuId): void => {
            ctx.session.menu = menu;
        },
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
