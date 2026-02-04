import "@/env";
import { session, Telegraf } from "telegraf";
import type { MenuDeps } from "@/bot/menu";
import type { MenuDefinition, MenuId } from "@/bot/menu/register";
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

function buildDeps(appConfig: AppConfig, routers: RoutersConfig, startedAtMs: number) {
    return {
        status: {
            ownerId: appConfig.ownerId,
            startedAtMs,
        },
        routers,
    } as const;
}

function registerMiddlewares(bot: Telegraf<BotCtx>, appConfig: AppConfig): void {
    const middlewares: MiddlewareFn<BotCtx>[] = buildMiddlewares({ ownerId: appConfig.ownerId });
    for (const mw of middlewares) {
        bot.use(mw);
    }
}

function createBot(appConfig: AppConfig, logger: Logger): Telegraf<BotCtx> {
    const bot = new Telegraf<BotCtx>(appConfig.botToken);
    bot.use(
        session({
            defaultSession: () => ({}),
        }),
    );
    bot.use((ctx: BotCtx, next): Promise<void> => {
        ctx.state.config = appConfig;
        return next();
    });
    bot.catch((err: unknown): void => {
        logger.error("Unhandled error", err);
    });
    return bot;
}

function registerMenuSystem(bot: Telegraf<BotCtx>, deps: MenuDeps): void {
    const menus: Record<MenuId, MenuDefinition> = buildMenus(deps);
    registerMenu(bot, {
        menus,
        columnsByMenu: {
            main: 4,
            tools: 4,
            routers: 4,
            router_actions: 4,
        },
        getMenuId: (ctx: BotCtx): MenuId => ctx.session.menu ?? "main",
        setMenuId: (ctx: BotCtx, menu: MenuId): void => {
            ctx.state.menu = menu;
        },
    });
}

function initApp(): { appConfig: AppConfig; routers: RoutersConfig; startedAtMs: number } {
    return {
        startedAtMs: Date.now(),
        appConfig: loadConfig(),
        routers: loadRoutersConfig(),
    };
}

function bootstrapBot(
    bot: Telegraf<BotCtx>,
    params: {
        appConfig: AppConfig;
        routers: RoutersConfig;
        startedAtMs: number;
    },
): void {
    const deps = buildDeps(params.appConfig, params.routers, params.startedAtMs);
    registerMiddlewares(bot, params.appConfig);
    registerMenuSystem(bot, deps);
}

async function main(): Promise<void> {
    const { appConfig, routers, startedAtMs } = initApp();
    const bot = createBot(appConfig, logger);

    bootstrapBot(bot, { appConfig, routers, startedAtMs });

    logger.info("Bot launching...", { mode: "polling" });
    await bot.launch();

    process.once("SIGINT", (): void => bot.stop("SIGINT"));
    process.once("SIGTERM", (): void => bot.stop("SIGTERM"));
}

main().catch((err): never => {
    logger.error("(fatal error in main)", err);
    process.exit(1);
});
