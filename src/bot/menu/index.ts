import type { StatusOptions } from "@/bot/commands/status";
import type { MenuDefinition, MenuFactory, MenuId, StaticMenu } from "@/bot/menu/register";
import type { BotCtx } from "@/bot/types";
import type { RouterActionConfig, RouterConfig, RoutersConfig } from "@/routers/config";
import { createRouterHandler } from "@/bot/commands/router";
import { statusCommand } from "@/bot/commands/status";
import { runRouterAction } from "@/routers/commands";

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

function setMenu(ctx: BotCtx, menu: MenuId, text?: string): Promise<void> {
    ctx.session.menu = menu;
    if (text) {
        return ctx.state.replyWithMenu?.(text) ?? Promise.resolve();
    }
    return Promise.resolve();
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
                    await setMenu(ctx, "router_actions", `Router: ${r.label}\nChoose action`);
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
                await setMenu(ctx, "tools", "Tools");
            },
        },
    ];
}

function routerActionsCommands(deps: MenuDeps, ctx: BotCtx): readonly MenuCommand[] {
    const routerId: string | undefined = ctx.session.routerId;
    if (!routerId) {
        return [];
    }
    const router: RouterConfig | undefined = deps.routers.routers.find((r: RouterConfig): boolean => r.id === routerId);
    if (!router) {
        return [];
    }
    const actionCommands: MenuCommand[] = deps.routers.actions
        .filter((a: RouterActionConfig): boolean => a.targets.includes(router.type))
        .map(
            (a: RouterActionConfig): MenuCommand => ({
                id: `router_actions.${a.id}`,
                label: a.label,
                description: a.description,
                triggers: [a.id, a.label],
                handler: async (ctx: BotCtx): Promise<void> => {
                    await ctx.reply(`<i>Running ${router.label} - ${a.label}...</i>`, { parse_mode: "HTML" });
                    const out: string = await runRouterAction(router, a);
                    await ctx.reply(out, { parse_mode: "HTML" });
                },
            }),
        );
    return [
        ...actionCommands,
        {
            id: "router_actions.back",
            label: "Back",
            description: "Back to routers",
            triggers: ["Back", "back"],
            handler: async (ctx: BotCtx): Promise<void> => {
                await setMenu(ctx, "routers", "Routers");
            },
        },
    ];
}

function routerActionsMenu(deps: MenuDeps): MenuFactory {
    return menuFactory((ctx: BotCtx): readonly MenuCommand[] => routerActionsCommands(deps, ctx));
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

function menuFactory(fn: (ctx: BotCtx) => readonly MenuCommand[]): MenuFactory {
    const func = (ctx: BotCtx): readonly MenuCommand[] => attachCommandLogging(fn(ctx));
    Object.defineProperty(func, "kind", {
        value: "factory",
        writable: false,
        enumerable: true,
    });
    return func as MenuFactory;
}

function staticMenu(cmds: readonly MenuCommand[]): StaticMenu {
    return {
        kind: "static",
        commands: attachCommandLogging(cmds),
    };
}

export function buildMenus(deps: MenuDeps): Record<MenuId, MenuDefinition> {
    return {
        main: staticMenu([
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
                    await setMenu(ctx, "tools", `Tools menu`);
                },
            },
        ]),
        tools: staticMenu([
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
                    await setMenu(ctx, "main", `Main menu`);
                },
            },
        ]),
        routers: staticMenu(routerMenuCommands(deps)),
        router_actions: routerActionsMenu(deps),
    };
}
