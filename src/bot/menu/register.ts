import type { MenuCommand } from "@/bot/menu";
import type { BotCtx } from "@/bot/types";
import type { Telegraf } from "telegraf";
import { withMainMenu } from "@/bot/menu/keyboard";

export type MenuId = "main" | "tools";

export interface MenuConfig {
    menus: Record<MenuId, readonly MenuCommand[]>;
    columnsByMenu: Record<MenuId, number>;
    getMenuId(ctx: BotCtx): MenuId;
    setMenuId(ctx: BotCtx, menu: MenuId): void;
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

export function registerMenu(bot: Telegraf<BotCtx>, config: MenuConfig): void {
    function commandsFor(ctx: BotCtx): readonly MenuCommand[] {
        return config.menus[config.getMenuId(ctx)];
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
            const raw = getMessageText(ctx);
            if (!raw) {
                await replyWithMenu(ctx, "Unknown command");
                return;
            }
            const commands = commandsFor(ctx);
            const byLabel = commands.find((c) => c.label === raw);
            if (byLabel) {
                await byLabel.handler(ctx);
                return;
            }
            const triggerMap = buildTriggerMap(commands);
            const key = normalizeFreeText(raw);
            const byTrigger = triggerMap.get(key);
            if (byTrigger) {
                await byTrigger.handler(ctx);
                return;
            }
            await replyWithMenu(ctx, "Unknown command");
        });
    });
    const allCommands: MenuCommand[] = [...config.menus.main, ...config.menus.tools];
    for (const c of allCommands) {
        if (!c.command) continue;
        bot.command(c.command, async (ctx: BotCtx): Promise<void> => {
            await run(ctx, async (): Promise<void> => {
                await c.handler(ctx);
            });
        });
    }
}
