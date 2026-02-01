import type { BotCtx } from "@/bot/types";
import type { RouterAction, RouterActionId } from "@/routers/commands";
import type { RouterConfig, RoutersConfig } from "@/routers/config";
import { ROUTER_ACTIONS } from "@/routers/commands";

function isOwner(ctx: BotCtx): boolean {
    const owner: number | null = ctx.state.config?.ownerId ?? null;
    return owner !== null && ctx.from?.id === owner;
}

function findRouter(cfg: RoutersConfig, id: string): RouterConfig | undefined {
    return cfg.routers.find((r: RouterConfig): boolean => r.id === id);
}

function findAction(id: string): RouterActionId | undefined {
    return (ROUTER_ACTIONS as readonly { id: RouterActionId }[]).some(
        (a: { id: RouterActionId }): boolean => a.id === id,
    )
        ? (id as RouterActionId)
        : undefined;
}

export function createRouterHandler(deps: { routers: RoutersConfig }) {
    return async (ctx: BotCtx): Promise<void> => {
        if (!isOwner(ctx)) {
            await ctx.reply("Access denied");
            return;
        }

        const text: string = ctx.message && "text" in ctx.message ? ctx.message.text : "";
        const parts: string[] = text.trim().split(/\s+/g).filter(Boolean);
        if (parts.length < 3) {
            const routersList: string = deps.routers.routers
                .map((router: RouterConfig): string => `${router.id} - ${router.label}`)
                .join("\n");
            const actionsList: string = ROUTER_ACTIONS.map((a: RouterAction): string => `${a.id} - ${a.label}`).join(
                "\n",
            );
            await ctx.reply(
                `<b>Usage</b>\n<pre>/r routerId action\nRouters:\n${routersList}\nActions:\n${actionsList}</pre>`,
                { parse_mode: "HTML" },
            );
            return;
        }

        const routerId: string = parts[1];
        const actionIdRaw: string = parts[2];
        const router: RouterConfig | undefined = findRouter(deps.routers, routerId);
        const actionId: RouterActionId | undefined = findAction(actionIdRaw);
        const action: RouterAction | undefined = ROUTER_ACTIONS.find((a: RouterAction): boolean => a.id === actionId);
        if (!router) {
            await ctx.reply(`Unknown router: <code>${routerId}</code>`, { parse_mode: "HTML" });
            return;
        }

        if (!action) {
            await ctx.reply(`Unknown action: <code>${actionIdRaw}</code>`, { parse_mode: "HTML" });
            return;
        }
        ctx.state.logger?.info("Router action requested", {
            routerId: router.id,
            actionId: action.id,
            fromId: ctx.from?.id,
        });
        await ctx.reply(`<i>Running ${router.label} - ${action.label}...</i>`, { parse_mode: "HTML" });
        try {
            const out = await action.run(router);
            await ctx.reply(out, { parse_mode: "HTML" });
        } catch (err) {
            ctx.state.logger?.error("Router action failed", err, { routerId: router.id, actionId: action?.id });
            await ctx.reply("Failed to execute router action");
        }
    };
}
