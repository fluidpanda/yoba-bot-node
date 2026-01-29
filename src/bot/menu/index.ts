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

export function buildMenus(deps: MenuDeps): Record<MenuId, readonly MenuCommand[]> {
    return {
        main: [
            {
                id: "ping",
                label: "Ping",
                description: "Ping",
                triggers: ["Ping", "/ping"],
                command: "ping",
                handler: async (ctx: BotCtx): Promise<void> => {
                    ctx.state.logger?.info("Pong requested", {
                        fromId: ctx.from?.id,
                    });
                    await ctx.reply(`Pong`);
                },
            },
            {
                id: "whoami",
                label: "Show Id",
                description: "Show your Id",
                triggers: [],
                command: "whoami",
                handler: async (ctx: BotCtx): Promise<void> => {
                    ctx.state.logger?.info("Id requested", {
                        fromId: ctx.from?.id,
                    });
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
                id: "open_tools",
                label: "Tools",
                description: "Open tools menu",
                triggers: [],
                handler: async (ctx: BotCtx): Promise<void> => {
                    ctx.session.menu = "tools";
                    ctx.state.logger?.info("Open tools menu", {
                        fromId: ctx.from?.id,
                    });
                    await ctx.state.replyWithMenu?.("Tools menu");
                },
            },
        ],
        tools: [
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
                id: "back",
                description: "Return to main menu",
                label: "Back",
                triggers: [],
                command: "back",
                handler: async (ctx: BotCtx): Promise<void> => {
                    ctx.session.menu = "main";
                    await ctx.state.replyWithMenu?.("Main menu");
                },
            },
        ],
    };
}
