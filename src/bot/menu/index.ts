import type { StatusOptions } from "@/bot/commands/status";
import type { MenuId } from "@/bot/menu/register";
import type { BotCtx } from "@/bot/types";
import { statusCommand } from "@/bot/commands/status";

export interface MenuCommand {
    id: string;
    label: string;
    description: string;
    triggers: readonly string[];
    command?: string;
    handler: (ctx: BotCtx) => Promise<void>;
}

export interface MenuDeps {
    status: StatusOptions;
}

function attachCommandLogging(cmds: readonly MenuCommand[]): readonly MenuCommand[] {
    return cmds.map((cmd: MenuCommand) => ({
        ...cmd,
        handler: async (ctx: BotCtx): Promise<void> => {
            ctx.state.logger?.info(`CMD:${cmd.id?.toUpperCase()}`);
            await cmd.handler(ctx);
        },
    }));
}

export function buildMenus(deps: MenuDeps): Record<MenuId, readonly MenuCommand[]> {
    const main: readonly MenuCommand[] = attachCommandLogging([
        {
            id: "ping",
            label: "Ping",
            description: "Ping",
            triggers: ["Ping", "/ping"],
            command: "ping",
            handler: async (ctx: BotCtx): Promise<void> => {
                await ctx.reply(`Pong!`);
            },
        },
        {
            id: "id",
            label: "Show Id",
            description: "Show your Id",
            triggers: [],
            command: "id",
            handler: async (ctx: BotCtx): Promise<void> => {
                await ctx.reply(`Your id: <code>${ctx.from?.id ?? "unknown"}</code>`, { parse_mode: "HTML" });
            },
        },
        (() => {
            const status: MenuCommand = statusCommand(deps.status);
            return {
                id: status.id,
                label: status.label,
                description: status.description,
                triggers: status.triggers,
                command: status.command,
                handler: status.handler,
            } satisfies MenuCommand;
        })(),
        {
            id: "to_tools",
            label: "Tools",
            description: "Open tools menu",
            triggers: [],
            handler: async (ctx: BotCtx): Promise<void> => {
                ctx.session.menu = "tools";
                await ctx.state.replyWithMenu?.("Tools menu");
            },
        },
    ]);
    const tools = attachCommandLogging([
        {
            id: "yoba_tool",
            description: "yoba tools test",
            label: "Yoba Tool",
            triggers: ["yoba tool", "yoba"],
            command: "yoba_tool",
            handler: async (ctx: BotCtx): Promise<void> => {
                await ctx.reply(`Yoba tool reply`);
            },
        },
        {
            id: "back_to_main",
            description: "Return to main menu",
            label: "Back",
            triggers: [],
            command: "back",
            handler: async (ctx: BotCtx): Promise<void> => {
                ctx.session.menu = "main";
                await ctx.state.replyWithMenu?.("Main menu");
            },
        },
    ]);
    return { main, tools };
}
