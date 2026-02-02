import type { StatusOptions } from "@/bot/commands/status";
import type { MenuId } from "@/bot/menu/register";
import type { BotCtx } from "@/bot/types";
import type { RouterConfig, RoutersConfig } from "@/routers/config";
import { createRouterHandler } from "@/bot/commands/router";
import { statusCommand } from "@/bot/commands/status";
import { ROUTER_ACTIONS } from "@/routers/commands";

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
    routers: RoutersConfig;
}

function routerMenuCommands(deps: MenuDeps): readonly MenuCommand[] {
    return [
        ...deps.routers.routers.map(
            (r: RouterConfig): MenuCommand => ({
                id: `routers.pick.${r.id}`,
                label: r.label,
                description: r.label,
                triggers: [r.id, r.label],
                handler: async (ctx: BotCtx): Promise<void> => {
                    ctx.session.routerId = r.id;
                    ctx.session.menu = "router_actions";
                    await ctx.state.replyWithMenu?.(`Router: ${r.label}\nChoose action`);
                },
            }),
        ),
        {
            id: "routers.back",
            label: "Back",
            description: "Back to tools",
            triggers: ["Back", "back"],
            handler: async (ctx: BotCtx): Promise<void> => {
                ctx.session.routerId = undefined;
                ctx.session.menu = "tools";
                await ctx.state.replyWithMenu?.("Tools");
            },
        },
    ];
}

function routerActionsMenuCommands(deps: MenuDeps): readonly MenuCommand[] {
    return [
        ...ROUTER_ACTIONS.map(
            (a): MenuCommand => ({
                id: `routers_actions.${a.id}`,
                label: a.label,
                description: a.description,
                triggers: [a.id, a.label],
                handler: async (ctx: BotCtx): Promise<void> => {
                    const routerId = ctx.session.routerId;
                    if (!routerId) {
                        ctx.session.menu = "routers";
                        await ctx.state.replyWithMenu?.("Select router");
                        return;
                    }
                    const router: RouterConfig | undefined = deps.routers.routers.find(
                        (r: RouterConfig): boolean => r.id === routerId,
                    );
                    if (!router) {
                        ctx.session.menu = "routers";
                        await ctx.state.replyWithMenu?.("Router not found, select again");
                        return;
                    }
                    await ctx.reply(`<i>Running ${router.label} - ${a.label}...</i>`, { parse_mode: "HTML" });
                    const out = await a.run(router);
                    await ctx.reply(out, { parse_mode: "HTML" });
                },
            }),
        ),
        {
            id: "routers_actions.back",
            label: "Back",
            description: "Back to routers",
            triggers: ["Back", "back"],
            handler: async (ctx: BotCtx): Promise<void> => {
                ctx.session.menu = "routers";
                await ctx.state.replyWithMenu?.("Select router");
            },
        },
    ];
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
            triggers: [],
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
            id: "tools",
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
            triggers: ["yoba_tool", "yoba"],
            command: "yoba_tool",
            handler: async (ctx: BotCtx): Promise<void> => {
                await ctx.reply(`Yoba tool reply`);
            },
        },
        {
            id: "router",
            label: "Router",
            description: "Router actions via Ssh",
            triggers: ["Router", "/router", "/r"],
            command: "r",
            handler: createRouterHandler({ routers: deps.routers }),
        },
        {
            id: "tools.back",
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
    const routers = attachCommandLogging(routerMenuCommands(deps));
    const router_actions = attachCommandLogging(routerActionsMenuCommands(deps));
    return { main, tools, routers, router_actions };
}
