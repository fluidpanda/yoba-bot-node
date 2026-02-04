import type { MenuCommand } from "@/bot/menu";
import type { BotCtx } from "@/bot/types";
import type { Telegraf } from "telegraf";
import { withMainMenu } from "@/bot/menu/keyboard";

export type MenuId = "main" | "tools" | "routers" | "router_actions";

export interface MenuConfig {
    menus: Record<MenuId, MenuDefinition>;
    columnsByMenu: Record<MenuId, number>;
    getMenuId(ctx: BotCtx): MenuId;
    setMenuId(ctx: BotCtx, menu: MenuId): void;
}

export interface MenuFactory {
    readonly kind: "factory";
    (ctx: BotCtx): readonly MenuCommand[];
}

export interface StaticMenu {
    readonly kind: "static";
    readonly commands: readonly MenuCommand[];
}

export type MenuDefinition = StaticMenu | MenuFactory;

function isStaticMenu(menu: MenuDefinition): menu is StaticMenu {
    return menu.kind === "static";
}

function isMenuFactory(menu: MenuDefinition): menu is MenuFactory {
    return menu.kind === "factory";
}

function getMessageText(ctx: BotCtx): string | null {
    const msg = ctx.message;
    if (!msg) return null;
    if (!("text" in msg)) return null;
    return msg.text;
}

function normalizeFreeText(text: string): string {
    return text.trim().replace(/\s+/gu, " ").toLowerCase();
}

function runFactory(replyWithMenu: (ctx: BotCtx, text: string) => Promise<void>) {
    return async (ctx: BotCtx, fn: () => Promise<void>): Promise<void> => {
        try {
            await fn();
        } catch (err) {
            ctx.state.logger?.error("Command handler failed", { err });
            await replyWithMenu(ctx, "Command failed");
        }
    };
}

function buildTriggerMap(commands: readonly MenuCommand[]): Map<string, MenuCommand> {
    const triggerMap = new Map<string, MenuCommand>();
    for (const c of commands) {
        for (const t of c.triggers) {
            triggerMap.set(normalizeFreeText(t), c);
        }
    }
    return triggerMap;
}

function getAllStaticCommands(config: MenuConfig): readonly MenuCommand[] {
    const result: MenuCommand[] = [];
    for (const menu of Object.values(config.menus)) {
        if (!isStaticMenu(menu)) continue;
        for (const cmd of menu.commands) {
            if (cmd.command) {
                result.push(cmd);
            }
        }
    }
    return result;
}

export function registerMenu(bot: Telegraf<BotCtx>, config: MenuConfig): void {
    function commandsFor(ctx: BotCtx): readonly MenuCommand[] {
        const menu: MenuDefinition = config.menus[config.getMenuId(ctx)];
        if (isMenuFactory(menu)) {
            return menu(ctx);
        }
        return menu.commands;
    }
    function columnsFor(ctx: BotCtx): number {
        return config.columnsByMenu[config.getMenuId(ctx)];
    }
    async function replyWithMenu(ctx: BotCtx, text: string): Promise<void> {
        const commands = commandsFor(ctx);
        const columns = columnsFor(ctx);
        await ctx.reply(text, withMainMenu(commands, columns));
    }
    bot.use(async (ctx: BotCtx, next: () => Promise<void>): Promise<void> => {
        ctx.state.replyWithMenu = async (text: string): Promise<void> => {
            await replyWithMenu(ctx, text);
        };
        await next();
    });

    const run = runFactory(replyWithMenu);
    bot.start(async (ctx: BotCtx): Promise<void> => {
        config.setMenuId(ctx, "main");
        await run(ctx, async (): Promise<void> => {
            await replyWithMenu(ctx, "All commands");
        });
    });
    bot.hears(/.*/, async (ctx: BotCtx): Promise<void> => {
        await run(ctx, async (): Promise<void> => {
            const raw: string | null = getMessageText(ctx);
            if (!raw) {
                await replyWithMenu(ctx, "Unknown command");
                return;
            }

            const firstToken: string = raw.trim().split(/\s+/g)[0] ?? raw;
            const key: string = normalizeFreeText(firstToken);

            const staticCommands: readonly MenuCommand[] = getAllStaticCommands(config);
            if (firstToken.startsWith("/")) {
                const globalTriggerMap: Map<string, MenuCommand> = buildTriggerMap(staticCommands);
                const global: MenuCommand | undefined = globalTriggerMap.get(key);
                if (global) {
                    await global.handler(ctx);
                    return;
                }
            }

            const commands: readonly MenuCommand[] = commandsFor(ctx);

            const byLabel = commands.find((c) => c.label === raw);
            if (byLabel) {
                await byLabel.handler(ctx);
                return;
            }

            const triggerMap: Map<string, MenuCommand> = buildTriggerMap(commands);
            const byTrigger = triggerMap.get(key);
            if (byTrigger) {
                await byTrigger.handler(ctx);
                return;
            }
            await replyWithMenu(ctx, "Unknown command");
        });
    });
    const staticCommands: readonly MenuCommand[] = getAllStaticCommands(config);
    for (const c of staticCommands) {
        bot.command(c.command!, async (ctx: BotCtx): Promise<void> => {
            await run(ctx, async (): Promise<void> => {
                await c.handler(ctx);
            });
        });
    }
}
