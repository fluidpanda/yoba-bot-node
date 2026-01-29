import type { MenuCommand } from "@/bot/menu/index";
import type { BotCtx } from "@/bot/types";
import type { Telegraf } from "telegraf";
import { withMainMenu } from "@/bot/menu/keyboard";

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

export function registerMenu(bot: Telegraf<BotCtx>, commands: readonly MenuCommand[], columns: number): void {
    async function replyWithMenu(ctx: BotCtx, text: string): Promise<void> {
        await ctx.reply(text, withMainMenu(commands, columns));
    }
    const run = runFactory(replyWithMenu);

    bot.start(async (ctx: BotCtx): Promise<void> => {
        await run(ctx, async (): Promise<void> => {
            await replyWithMenu(ctx, "All commands");
        });
    });

    const labels = commands.map((c) => c.label);
    bot.hears(labels, async (ctx: BotCtx): Promise<void> => {
        await run(ctx, async (): Promise<void> => {
            const text = getMessageText(ctx);
            if (!text) {
                await replyWithMenu(ctx, "Unknown command");
                return;
            }

            const cmd = commands.find((c) => c.label === text);
            if (!cmd) {
                await replyWithMenu(ctx, "Unknown command");
                return;
            }

            await cmd.handler(ctx);
        });
    });

    for (const c of commands) {
        if (!c.command) continue;
        bot.command(c.command, async (ctx: BotCtx): Promise<void> => {
            await run(ctx, async (): Promise<void> => {
                await c.handler(ctx);
            });
        });
    }

    const triggerMap = new Map<string, MenuCommand>();
    for (const c of commands) {
        for (const t of c.triggers) {
            triggerMap.set(normalizeFreeText(t), c);
        }
    }

    bot.hears(/.*/, async (ctx: BotCtx): Promise<void> => {
        await run(ctx, async (): Promise<void> => {
            const raw = getMessageText(ctx);
            if (!raw) {
                await replyWithMenu(ctx, "Unknown command");
                return;
            }

            const key = normalizeFreeText(raw);
            const cmd = triggerMap.get(key);
            if (!cmd) {
                await replyWithMenu(ctx, "Unknown command");
                return;
            }

            await cmd.handler(ctx);
        });
    });
}
