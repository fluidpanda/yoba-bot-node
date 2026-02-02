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

function parseRouterArgs(ctx: BotCtx): { routerId?: string; actionIdRaw?: string } {
    const msg = ctx.message;
    if (msg && "text" in msg) {
        const text: string = msg.text.trim();
        if (!text) return {};
        const parts: string[] = text.split(/\s+/g).filter(Boolean);
        const cmd: string = (parts[0] ?? "").split("@")[0];
        if (cmd !== "/r" && cmd !== "/router") return {};
        return { routerId: parts[1], actionIdRaw: parts[2] };
    }
    const anyCtx = ctx as unknown as { payload?: unknown };
    const payload: string = typeof anyCtx.payload === "string" ? anyCtx.payload.trim() : "";
    if (!payload) return {};
    const parts: string[] = payload.split(/\s+/g).filter(Boolean);
    return { routerId: parts[0], actionIdRaw: parts[1] };
}

export function createRouterHandler(deps: { routers: RoutersConfig }) {
    return async (ctx: BotCtx): Promise<void> => {
        if (!isOwner(ctx)) {
            await ctx.reply("Access denied");
            return;
        }
        const { routerId, actionIdRaw } = parseRouterArgs(ctx);
        if (!routerId) {
            ctx.session.routerId = undefined;
            ctx.session.menu = "routers";
            await ctx.state.replyWithMenu?.("Select router");
            return;
        }
        const router: RouterConfig | undefined = findRouter(deps.routers, routerId);
        if (!router) {
            await ctx.reply(`Unknown router: <code>${routerId}</code>`, { parse_mode: "HTML" });
            return;
        }
        if (!actionIdRaw) {
            ctx.session.routerId = router.id;
            ctx.session.menu = "router_actions";
            await ctx.state.replyWithMenu?.(`Router: ${router.label}\nChoose action`);
            return;
        }
        const actionId: RouterActionId | undefined = findAction(actionIdRaw);
        const action: RouterAction | undefined = ROUTER_ACTIONS.find((a: RouterAction): boolean => a.id === actionId);
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
            ctx.state.logger?.error("Router action failed", err, { routerId: router.id, actionId: action.id });
            await ctx.reply("Failed to execute router action");
        }
    };
}
