import { Markup } from "telegraf";
import type { BotApi, BotCtx, Plugin } from "@/bot/types";
import { pingCommand } from "@/bot/commands/ping";
import { statusCommand } from "@/bot/commands/status";
import { whoamiCommand } from "@/bot/commands/whoami";

export interface BotCommand {
    name: string;
    description: string;
    menu?: {
        label: string;
        action: string;
    };
    handler(ctx: BotCtx): Promise<void>;
}

export function buildCommands(opts: { ownerId: number | null; startedAtMs: number }): BotCommand[] {
    return [pingCommand, whoamiCommand, statusCommand(opts)];
}

export function commandsPlugin(commands: BotCommand[]): Plugin {
    return (bot: BotApi): void => {
        const buildMenu = () =>
            Markup.inlineKeyboard(
                commands
                    .filter((c: BotCommand) => c.menu)
                    .map((c: BotCommand) => [Markup.button.callback(c.menu!.label, c.menu!.action)]),
            );
        bot.start(async (ctx: BotCtx): Promise<void> => {
            ctx.state.logger?.info("Start command");
            await ctx.reply("Yoba menu", buildMenu());
        });
        for (const cmd of commands) {
            bot.command(cmd.name, async (ctx: BotCtx): Promise<void> => {
                await cmd.handler(ctx);
            });
            if (cmd.menu) {
                bot.action(cmd.menu.action, async (ctx: BotCtx): Promise<void> => {
                    await ctx.answerCbQuery();
                    await cmd.handler(ctx);
                });
            }
        }
    };
}
