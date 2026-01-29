import type { StatusOptions } from "@/bot/commands/status";
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

export function buildMenuCommands(deps: MenuDeps): readonly MenuCommand[] {
    return [
        {
            id: "ping",
            label: "Ping",
            description: "Ping",
            triggers: ["Ping", "/ping"],
            command: "ping",
            handler: async (ctx: BotCtx): Promise<void> => {
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
                await ctx.reply(`Your id: ${ctx.from?.id ?? "unknown"}`);
            },
        },
        (() => {
            const status = statusCommand(deps.status);
            return {
                id: status.id,
                label: status.label,
                description: status.description,
                triggers: status.triggers,
                command: status.command,
                handler: status.handler,
            } satisfies MenuCommand;
        })(),
    ] as const;
}
